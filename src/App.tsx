import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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
  ShortBreak: "Short Break",
  LongBreak: "Long Break",
};

const modeOrder: TimerMode[] = ["Focus", "ShortBreak", "LongBreak"];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const intervalRef = useRef<number | null>(null);

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
    fetchState();
    fetchSettings();

    const unlisteners: Promise<() => void>[] = [
      listen("timer-started", fetchState),
      listen("timer-paused", fetchState),
      listen("timer-reset", fetchState),
      listen("timer-tick", fetchState),
      listen("mode-changed", fetchState),
      listen("timer-completed", fetchState),
      listen("tray-start", () => invoke("start_timer").then(fetchState)),
      listen("tray-pause", () => invoke("pause_timer").then(fetchState)),
      listen("tray-reset", () => invoke("reset_timer").then(fetchState)),
    ];

    return () => {
      unlisteners.forEach((p) => p.then((f) => f()));
    };
  }, [fetchState, fetchSettings]);

  useEffect(() => {
    if (state?.timer_state === "Running") {
      intervalRef.current = window.setInterval(async () => {
        try {
          await invoke("tick_timer");
        } catch (e) {
          console.error("Tick error:", e);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state?.timer_state]);

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

  if (!state) {
    return (
      <main className="container">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  const modeColors: Record<TimerMode, string> = {
    Focus: "#E74C3C",
    ShortBreak: "#27AE60",
    LongBreak: "#3498DB",
  };

  const currentColor = modeColors[state.mode];

  return (
    <main className="container">
      <div className="header">
        <h1 className="title">
          <span className="tomato">🍅</span> Pomodoro
        </h1>
      </div>

      <div className="timer-display" style={{ borderColor: currentColor }}>
        <div className="time" style={{ color: currentColor }}>
          {formatTime(state.remaining_seconds)}
        </div>
      </div>

      <div className="mode-indicator">
        {modeOrder.map((mode) => (
          <button
            key={mode}
            className={`mode-btn ${state.mode === mode ? "active" : ""}`}
            style={{
              borderColor:
                state.mode === mode ? modeColors[mode] : "transparent",
              color: state.mode === mode ? modeColors[mode] : "#7F8C8D",
            }}
            onClick={() => handleModeChange(mode)}
          >
            {modeLabels[mode]}
          </button>
        ))}
      </div>

      <div className="controls">
        {state.timer_state === "Running" ? (
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

      <div className="session-counter">
        <span className="tomato">🍅</span> Completed: {state.completed_sessions}/
        {settings.sessions_before_long_break}
      </div>

      <button
        className="settings-toggle"
        onClick={() => setShowSettings(!showSettings)}
      >
        Settings {showSettings ? "▲" : "▼"}
      </button>

      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label>Focus Duration (min)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.focus_duration}
              onChange={(e) =>
                handleSettingChange("focus_duration", parseInt(e.target.value) || 25)
              }
            />
          </div>
          <div className="setting-item">
            <label>Short Break (min)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.short_break_duration}
              onChange={(e) =>
                handleSettingChange("short_break_duration", parseInt(e.target.value) || 5)
              }
            />
          </div>
          <div className="setting-item">
            <label>Long Break (min)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.long_break_duration}
              onChange={(e) =>
                handleSettingChange("long_break_duration", parseInt(e.target.value) || 15)
              }
            />
          </div>
          <div className="setting-item">
            <label>Sessions before long break</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.sessions_before_long_break}
              onChange={(e) =>
                handleSettingChange(
                  "sessions_before_long_break",
                  parseInt(e.target.value) || 4
                )
              }
            />
          </div>
          <div className="setting-item toggle">
            <label>Auto-start breaks</label>
            <input
              type="checkbox"
              checked={settings.auto_start_breaks}
              onChange={(e) =>
                handleSettingChange("auto_start_breaks", e.target.checked)
              }
            />
          </div>
          <div className="setting-item toggle">
            <label>Auto-start pomodoros</label>
            <input
              type="checkbox"
              checked={settings.auto_start_pomodoros}
              onChange={(e) =>
                handleSettingChange("auto_start_pomodoros", e.target.checked)
              }
            />
          </div>
          <div className="setting-item toggle">
            <label>Sound notifications</label>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) =>
                handleSettingChange("sound_enabled", e.target.checked)
              }
            />
          </div>
          <button className="btn btn-small" onClick={handleResetCounter}>
            Reset Daily Counter
          </button>
        </div>
      )}
    </main>
  );
}

export default App;