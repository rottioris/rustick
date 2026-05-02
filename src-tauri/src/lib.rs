use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_log::{Target, TargetKind};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerMode {
    Focus,
    ShortBreak,
    LongBreak,
}

impl Default for TimerMode {
    fn default() -> Self {
        TimerMode::Focus
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerState {
    Idle,
    Running,
    Paused,
}

impl Default for TimerState {
    fn default() -> Self {
        TimerState::Idle
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub focus_duration: u32,
    pub short_break_duration: u32,
    pub long_break_duration: u32,
    pub sessions_before_long_break: u32,
    pub auto_start_breaks: bool,
    pub auto_start_pomodoros: bool,
    pub sound_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            focus_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            sessions_before_long_break: 4,
            auto_start_breaks: false,
            auto_start_pomodoros: false,
            sound_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub timer_state: TimerState,
    pub mode: TimerMode,
    pub remaining_seconds: u32,
    pub completed_sessions: u32,
    pub settings: Settings,
}

impl Default for AppState {
    fn default() -> Self {
        let settings = Settings::default();
        AppState {
            timer_state: TimerState::Idle,
            mode: TimerMode::Focus,
            remaining_seconds: settings.focus_duration * 60,
            completed_sessions: 0,
            settings,
        }
    }
}

impl AppState {
    pub fn get_duration_for_mode(&self, mode: TimerMode) -> u32 {
        match mode {
            TimerMode::Focus => self.settings.focus_duration * 60,
            TimerMode::ShortBreak => self.settings.short_break_duration * 60,
            TimerMode::LongBreak => self.settings.long_break_duration * 60,
        }
    }
}

pub struct AppStateWrapper(pub Mutex<AppState>);

impl AppStateWrapper {
    pub fn new() -> Self {
        AppStateWrapper(Mutex::new(AppState::default()))
    }
}

impl Default for AppStateWrapper {
    fn default() -> Self {
        Self::new()
    }
}

fn get_config_path() -> Option<std::path::PathBuf> {
    dirs::config_dir().map(|p| p.join("pomodoro-timer").join("settings.json"))
}

fn load_settings() -> Settings {
    if let Some(path) = get_config_path() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str(&content) {
                log::info!("Settings loaded from {:?}", path);
                return settings;
            }
        }
    }
    Settings::default()
}

fn save_settings(settings: &Settings) {
    if let Some(path) = get_config_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(content) = serde_json::to_string_pretty(settings) {
            let _ = std::fs::write(&path, content);
            log::info!("Settings saved to {:?}", path);
        }
    }
}

#[tauri::command]
fn get_state(state: State<AppStateWrapper>) -> Result<AppState, String> {
    let app_state = state.0.lock().map_err(|e| e.to_string())?;
    Ok(app_state.clone())
}

#[tauri::command]
fn start_timer(app: AppHandle, state: State<AppStateWrapper>) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    if app_state.timer_state == TimerState::Running {
        return Ok(app_state.clone());
    }
    
    app_state.timer_state = TimerState::Running;
    let current_state = app_state.clone();
    
    let _ = app.emit("timer-started", &current_state);
    log::info!("Timer started: mode={:?}, remaining={}", app_state.mode, app_state.remaining_seconds);
    
    Ok(current_state)
}

#[tauri::command]
fn pause_timer(app: AppHandle, state: State<AppStateWrapper>) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    if app_state.timer_state != TimerState::Running {
        return Ok(app_state.clone());
    }
    
    app_state.timer_state = TimerState::Paused;
    let current_state = app_state.clone();
    
    let _ = app.emit("timer-paused", &current_state);
    log::info!("Timer paused");
    
    Ok(current_state)
}

#[tauri::command]
fn reset_timer(app: AppHandle, state: State<AppStateWrapper>) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    app_state.timer_state = TimerState::Idle;
    app_state.remaining_seconds = app_state.get_duration_for_mode(app_state.mode);
    let current_state = app_state.clone();
    
    let _ = app.emit("timer-reset", &current_state);
    log::info!("Timer reset: mode={:?}", app_state.mode);
    
    Ok(current_state)
}

#[tauri::command]
fn tick_timer(app: AppHandle, state: State<AppStateWrapper>) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    if app_state.timer_state != TimerState::Running {
        return Ok(app_state.clone());
    }
    
    if app_state.remaining_seconds > 0 {
        app_state.remaining_seconds -= 1;
    } else {
        let completed_mode = app_state.mode;
        
        if completed_mode == TimerMode::Focus {
            app_state.completed_sessions += 1;
        }
        
        let next_mode = get_next_mode(&app_state.completed_sessions, &completed_mode, &app_state.settings);
        app_state.mode = next_mode;
        app_state.remaining_seconds = app_state.get_duration_for_mode(next_mode);
        app_state.timer_state = TimerState::Idle;
        
        if app_state.settings.sound_enabled {
            let _ = app.notification()
                .builder()
                .title("Pomodoro Timer")
                .body(&format!("{} completed! Time for {:?}.", completed_mode.name(), next_mode))
                .show();
        }
        
        let _ = app.emit("timer-completed", &app_state.clone());
        log::info!("Timer completed: {:?} -> {:?}", completed_mode, next_mode);
        
        if (next_mode == TimerMode::Focus && app_state.settings.auto_start_pomodoros) ||
           (next_mode != TimerMode::Focus && app_state.settings.auto_start_breaks) {
            app_state.timer_state = TimerState::Running;
        }
    }
    
    let _ = app.emit("timer-tick", &app_state.clone());
    
    Ok(app_state.clone())
}

impl TimerMode {
    pub fn name(&self) -> &str {
        match self {
            TimerMode::Focus => "Focus",
            TimerMode::ShortBreak => "Short Break",
            TimerMode::LongBreak => "Long Break",
        }
    }
}

fn get_next_mode(completed: &u32, current: &TimerMode, settings: &Settings) -> TimerMode {
    match current {
        TimerMode::Focus => {
            if completed % settings.sessions_before_long_break == 0 {
                TimerMode::LongBreak
            } else {
                TimerMode::ShortBreak
            }
        }
        TimerMode::ShortBreak | TimerMode::LongBreak => TimerMode::Focus,
    }
}

#[tauri::command]
fn set_mode(app: AppHandle, state: State<AppStateWrapper>, mode: TimerMode) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    app_state.mode = mode;
    app_state.timer_state = TimerState::Idle;
    app_state.remaining_seconds = app_state.get_duration_for_mode(mode);
    let current_state = app_state.clone();
    
    let _ = app.emit("mode-changed", &current_state);
    log::info!("Mode changed to {:?}", mode);
    
    Ok(current_state)
}

#[tauri::command]
fn get_settings(state: State<AppStateWrapper>) -> Result<Settings, String> {
    let app_state = state.0.lock().map_err(|e| e.to_string())?;
    Ok(app_state.settings.clone())
}

#[tauri::command]
fn update_settings(state: State<AppStateWrapper>, new_settings: Settings) -> Result<Settings, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    app_state.settings = new_settings.clone();
    
    if app_state.timer_state == TimerState::Idle {
        app_state.remaining_seconds = app_state.get_duration_for_mode(app_state.mode);
    }
    
    save_settings(&new_settings);
    log::info!("Settings updated: {:?}", new_settings);
    
    Ok(new_settings)
}

#[tauri::command]
fn reset_daily_counter(state: State<AppStateWrapper>) -> Result<AppState, String> {
    let mut app_state = state.0.lock().map_err(|e| e.to_string())?;
    
    app_state.completed_sessions = 0;
    log::info!("Daily counter reset");
    
    Ok(app_state.clone())
}

fn create_tray_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let start = MenuItem::with_id(app, "start", "Start Timer", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause Timer", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "reset", "Reset Timer", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    
    Menu::with_items(app, &[&show, &start, &pause, &reset, &quit])
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let menu = create_tray_menu(app)?;
    
    let _ = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Pomodoro Timer")
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            match id {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "start" => {
                    let _ = app.emit("tray-start", ());
                }
                "pause" => {
                    let _ = app.emit("tray-pause", ());
                }
                "reset" => {
                    let _ = app.emit("tray-reset", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    
    log::info!("System tray initialized");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }
    
    let settings = load_settings();
    let initial_remaining = settings.focus_duration * 60;
    
    let app_state = AppState {
        timer_state: TimerState::Idle,
        mode: TimerMode::Focus,
        remaining_seconds: initial_remaining,
        completed_sessions: 0,
        settings,
    };
    
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppStateWrapper(Mutex::new(app_state)))
        .setup(|app| {
            setup_tray(app.handle())?;
            log::info!("Pomodoro Timer application started");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
                log::info!("Window hidden to tray");
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            start_timer,
            pause_timer,
            reset_timer,
            tick_timer,
            set_mode,
            get_settings,
            update_settings,
            reset_daily_counter,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}