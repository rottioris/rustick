import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

type TimerMode = "Focus" | "ShortBreak" | "LongBreak";
type TimerState = "Idle" | "Running" | "Paused";

interface Settings {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  sound_enabled: boolean;
}

interface AppState {
  timer_state: TimerState;
  mode: TimerMode;
  remaining_seconds: number;
  completed_sessions: number;
  settings: Settings;
}

const defaultSettings: Settings = {
  focus_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sessions_before_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  sound_enabled: true,
};

const modeLabels: Record<TimerMode, string> = {
  Focus: "Focus",
  ShortBreak: "Short",
  LongBreak: "Long",
};

const modeColors: Record<TimerMode, string> = {
  Focus: "#e74c3c",
  ShortBreak: "#27ae60",
  LongBreak: "#3498db",
};

const modeOrder: TimerMode[] = ["Focus", "ShortBreak", "LongBreak"];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.error("Audio play error:", e);
  }
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const totalSeconds = useMemo(() => {
    if (!state || !settings) return 25 * 60;
    const { mode, settings: s } = state;
    if (mode === "Focus") return s.focus_duration * 60;
    if (mode === "ShortBreak") return s.short_break_duration * 60;
    return s.long_break_duration * 60;
  }, [state, settings]);

  const progress = useMemo(() => {
    if (!state || totalSeconds === 0) return 0;
    return ((totalSeconds - state.remaining_seconds) / totalSeconds) * 100;
  }, [state, totalSeconds]);

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const fetchState = useCallback(async () => {
    try {
      const currentState = await invoke<AppState>("get_state");
      setState(currentState);
    } catch (e) {
      console.error("Failed to get state:", e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const currentSettings = await invoke<Settings>("get_settings");
      setSettings(currentSettings);
    } catch (e) {
      console.error("Failed to get settings:", e);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchState(), fetchSettings()]).then(() => setIsLoaded(true));

    const unlisteners = Promise.all([
      listen("timer-started", fetchState),
      listen("timer-paused", fetchState),
      listen("timer-reset", fetchState),
      listen("timer-tick", fetchState),
      listen("mode-changed", fetchState),
      listen("timer-completed", fetchState),
      listen("play-sound", () => {
        if (settings.sound_enabled) {
          playNotificationSound();
        }
      }),
      listen("tray-start", () => invoke("start_timer").then(fetchState)),
      listen("tray-pause", () => invoke("pause_timer").then(fetchState)),
      listen("tray-reset", () => invoke("reset_timer").then(fetchState)),
    ]);

    return () => {
      unlisteners.then((listeners) => listeners.forEach((fn) => fn()));
    };
  }, [fetchState, fetchSettings]);

  useEffect(() => {
    if (state?.timer_state === "Running") {
      const interval = setInterval(async () => {
        try {
          await invoke("tick_timer");
        } catch (e) {
          console.error("Tick error:", e);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state?.timer_state]);

  useEffect(() => {
    const updateWindowTitle = async () => {
      try {
        const win = getCurrentWindow();
        if (state?.timer_state === "Running") {
          await win.setTitle(`🍅 ${formatTime(state.remaining_seconds)} - Pomodoro`);
        } else {
          await win.setTitle("Pomodoro Timer");
        }
      } catch (e) {
        console.error("Title update error:", e);
      }
    };
    updateWindowTitle();
  }, [state?.timer_state, state?.remaining_seconds]);

  const handleStart = async () => {
    try {
      await invoke("start_timer");
    } catch (e) {
      console.error("Start error:", e);
    }
  };

  const handlePause = async () => {
    try {
      await invoke("pause_timer");
    } catch (e) {
      console.error("Pause error:", e);
    }
  };

  const handleReset = async () => {
    try {
      await invoke("reset_timer");
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  const handleModeChange = async (mode: TimerMode) => {
    try {
      await invoke("set_mode", { mode });
    } catch (e) {
      console.error("Mode change error:", e);
    }
  };

  const handleSettingChange = async (key: keyof Settings, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await invoke("update_settings", { newSettings });
    } catch (e) {
      console.error("Save settings error:", e);
    }
  };

  const handleResetCounter = async () => {
    try {
      await invoke("reset_daily_counter");
      await fetchState();
    } catch (e) {
      console.error("Reset counter error:", e);
    }
  };

  const handleTestSound = async () => {
    playNotificationSound();
  };

  if (!isLoaded) {
    return (
      <main className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  const getFullModeLabel = (mode: TimerMode | undefined) => {
    if (mode === "Focus") return "Focus";
    if (mode === "ShortBreak") return "Short Break";
    if (mode === "LongBreak") return "Long Break";
    return "Focus";
  };

  return (
    <main className="container">
      <div className="header" style={{ justifyContent: "center" }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <h1 className="title">
          <span className="tomato-icon">🍅</span>
          Pomodoro
        </h1>
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          ⚙️
        </button>
      </div>

      <div className="status-badge">
        <span className="status-dot" />
        {state?.timer_state === "Running" ? "Running" : state?.timer_state === "Paused" ? "Paused" : "Idle"}
      </div>

      <div className="timer-container">
        <svg className="timer-ring" viewBox="0 0 180 180">
          <circle className="timer-ring-bg" cx="90" cy="90" r="80" />
          <circle
            className="timer-ring-progress"
            cx="90"
            cy="90"
            r="80"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="timer-text">
          <span className="time-display">
            {state ? formatTime(state.remaining_seconds) : "00:00"}
          </span>
          <span className="time-label">{getFullModeLabel(state?.mode)}</span>
        </div>
      </div>

      <div className="mode-indicator">
        {modeOrder.map((mode) => (
          <button
            key={mode}
            className={`mode-btn ${state?.mode === mode ? "active" : ""}`}
            onClick={() => handleModeChange(mode)}
            style={{ "--current-mode-color": modeColors[mode] } as React.CSSProperties}
          >
            {modeLabels[mode]}
          </button>
        ))}
      </div>

      <div className="controls">
        {state?.timer_state === "Running" ? (
          <button className="btn btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleStart}>
            Start
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="session-info">
        <span>🍅</span>
        <span>
          {state?.completed_sessions || 0} / {settings.sessions_before_long_break}
        </span>
        <div className="session-pills">
          {Array.from({ length: settings.sessions_before_long_break }).map((_, i) => (
            <span
              key={i}
              className={`session-pill ${
                i < (state?.completed_sessions || 0)
                  ? "completed"
                  : i === (state?.completed_sessions || 0)
                  ? "current"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">Settings</span>
              <button className="settings-close" onClick={() => setSettingsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="setting-item">
              <label>Focus (min)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.focus_duration}
                onChange={(e) =>
                  handleSettingChange("focus_duration", parseInt(e.target.value) || 25)
                }
              />
            </div>
            <div className="setting-item">
              <label>Short Break</label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.short_break_duration}
                onChange={(e) =>
                  handleSettingChange("short_break_duration", parseInt(e.target.value) || 5)
                }
              />
            </div>
            <div className="setting-item">
              <label>Long Break</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.long_break_duration}
                onChange={(e) =>
                  handleSettingChange("long_break_duration", parseInt(e.target.value) || 15)
                }
              />
            </div>
            <div className="setting-item">
              <label>Sessions</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.sessions_before_long_break}
                onChange={(e) =>
                  handleSettingChange("sessions_before_long_break", parseInt(e.target.value) || 4)
                }
              />
            </div>
            <div className="setting-item">
              <label>Auto breaks</label>
              <input
                type="checkbox"
                checked={settings.auto_start_breaks}
                onChange={(e) => handleSettingChange("auto_start_breaks", e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>Auto focus</label>
              <input
                type="checkbox"
                checked={settings.auto_start_pomodoros}
                onChange={(e) => handleSettingChange("auto_start_pomodoros", e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>Sounds</label>
              <input
                type="checkbox"
                checked={settings.sound_enabled}
                onChange={(e) => handleSettingChange("sound_enabled", e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <button className="btn-test-sound" onClick={handleTestSound}>
                Test Sound
              </button>
            </div>

            <div className="settings-actions">
              <button className="btn btn-secondary btn-reset-counter" onClick={handleResetCounter}>
                Reset Daily Counter
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;