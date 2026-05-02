# Pomodoro Timer Application Specification

## 1. Project Overview

**Project Name:** Pomodoro Timer
**Type:** Cross-platform desktop application
**Core Feature:** Minimalist Pomodoro timer with system tray support
**Target Users:** Productivity-focused individuals who want a lightweight, always-accessible timer

The application is a minimalist Pomodoro timer inspired by pomofocus.io, designed to work across all Linux desktop environments (Wayland, X11, Xfce, Cinnamon, etc.) and minimize to the system tray.

---

## 2. UI/UX Specification

### 2.1 Window Model

- **Main Window:** Single compact window (300x400px default)
- **System Tray:** Application lives in system tray when minimized
- **Window Behavior:**
  - Close button minimizes to tray (not exit)
  - Tray icon double-click restores window
  - Tray context menu provides quick actions

### 2.2 Visual Design

#### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary Background | Soft White | `#FAF9F6` |
| Secondary Background | Light Gray | `#E8E6E1` |
| Focus/Work Timer | Tomato Red | `#E74C3C` |
| Break Timer | Fresh Green | `#27AE60` |
| Long Break | Ocean Blue | `#3498DB` |
| Text Primary | Charcoal | `#2C3E50` |
| Text Secondary | Slate | `#7F8C8D` |
| Accent/Buttons | Warm Orange | `#E67E22` |

#### Typography
- **Font Family:** System UI font (Segoe UI on Windows, SF Pro on macOS, system default on Linux)
- **Timer Display:** 48px bold
- **Labels:** 14px regular
- **Buttons:** 14px medium

#### Spacing System
- Base unit: 8px
- Padding: 16px (2 units)
- Component spacing: 24px (3 units)
- Border radius: 8px

#### Visual Effects
- Subtle box shadows: `0 2px 8px rgba(0,0,0,0.1)`
- Smooth transitions: 200ms ease-in-out
- Button hover: slight brightness increase

### 2.3 Layout Structure

```
┌─────────────────────────┐
│      [─] [□] [×]        │  ← Title bar (native)
├─────────────────────────┤
│                         │
│      🍅 POMODORO       │  ← App title
│                         │
│    ┌───────────────┐    │
│    │               │    │
│    │    25:00      │    │  ← Timer display
│    │               │    │
│    └───────────────┘    │
│                         │
│   [ Focus ] [Short]    │  ← Mode indicator
│                         │
│  ┌─────┐ ┌─────┐       │
│  │START│ │RESET│       │
│  └─────┘ └─────┘       │
│                         │
│  🍅 Completed: 3/4      │  ← Session counter
│                         │
│  [Settings ⚙]          │  ← Settings toggle
└─────────────────────────┘
```

### 2.4 Components

| Component | States | Behavior |
|-----------|--------|----------|
| Timer Display | idle, running, paused | Shows mm:ss format |
| Start Button | default, hover, active, disabled | Starts/resumes timer |
| Reset Button | default, hover, active | Resets current session |
| Mode Indicator | focus, short-break, long-break | Shows current mode |
| Session Counter | display only | Shows completed pomodoros |
| Settings Panel | collapsed, expanded | Duration configuration |

### 2.5 Settings Panel (Expandable)

- Focus duration: 1-60 minutes (default: 25)
- Short break: 1-30 minutes (default: 5)
- Long break: 1-60 minutes (default: 15)
- Sessions before long break: 1-10 (default: 4)
- Auto-start breaks: toggle (default: off)
- Auto-start pomodoros: toggle (default: off)
- Sound notifications: toggle (default: on)

---

## 3. Functional Specification

### 3.1 Core Features

1. **Timer Functionality**
   - Countdown timer with second precision
   - Three modes: Focus (25 min), Short Break (5 min), Long Break (15 min)
   - Automatic mode switching after timer completion

2. **Session Tracking**
   - Track completed pomodoro sessions (focus periods)
   - Show progress: current/target sessions (e.g., 3/4)
   - Reset daily counter option

3. **System Tray Integration**
   - Minimize to system tray on close
   - Tray icon shows timer state (idle/running)
   - Tray context menu: Start/Pause, Reset, Show Window, Quit

4. **Notifications**
   - Desktop notification on timer completion
   - Optional sound notification

5. **Settings Persistence**
   - Save all settings to local config file
   - Load settings on app startup

### 3.2 User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Start Timer | Click Start button | Timer begins countdown |
| Pause Timer | Click Pause button | Timer pauses |
| Reset Timer | Click Reset button | Current mode resets to full duration |
| Change Mode | Auto after timer or manual | Switch to next mode |
| Minimize to Tray | Click close button | Window hides, tray icon active |
| Restore Window | Double-click tray icon | Window shows |
| Open Settings | Click Settings button | Settings panel expands |
| Quit App | Tray menu > Quit | Application exits |

### 3.3 Data Flow & Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (UI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ TimerView│  │Settings │  │TrayMenu  │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │                     │
│  ─────┴────────────┴────────────┴─────────────────  │
│                    TAURI IPC                          │
├─────────────────────────────────────────────────────────┤
│                  BACKEND (Rust)                       │
│  ┌────────────────────────────────────────────────┐  │
│  │              Application State                │  │
│  │  - timer_state (running/paused/idle)           │  │
│  │  - current_mode (focus/short_break/long_break)│  │
│  │  - remaining_seconds                          │  │
│  │  - completed_sessions                         │  │
│  │  - settings                                   │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────┐  ┌────┴────┐  ┌─────────────────┐ │
│  │ Timer Engine │  │ Commands│  │ Tray Manager    │ │
│  │ (tick loop)  │  │ (IPC)   │  │ (system tray)   │ │
│  └──────────────┘  └─────────┘  └─────────────────┘ │
└───────────────────────────────────────────���─────────────┘
```

### 3.4 Key Modules

| Module | Responsibility | Public API |
|--------|---------------|------------|
| `timer` | Countdown logic, tick generation | `start()`, `pause()`, `reset()`, `tick()` |
| `state` | Application state management | `get_state()`, `update_state()` |
| `tray` | System tray integration | `setup_tray()`, `update_icon()` |
| `settings` | Config persistence | `load()`, `save()`, `get_defaults()` |
| `notifications` | Desktop notifications | `notify()` |

### 3.5 Edge Cases

- **Timer already running when Start clicked:** Ignore or toggle to pause
- **App closed during timer:** Save state, restore on reopen
- **System sleep/hibernate:** Recalculate remaining time on wake
- **Invalid settings values:** Clamp to valid range
- **Missing system tray support:** Fall back to taskbar only

---

## 4. Acceptance Criteria

### 4.1 Success Conditions

- [ ] Timer counts down accurately in seconds
- [ ] Timer automatically transitions between focus/break modes
- [ ] Application minimizes to system tray on close
- [ ] Tray icon double-click restores window
- [ ] Tray context menu provides all quick actions
- [ ] Settings persist across application restarts
- [ ] Desktop notification appears on timer completion
- [ ] Application builds successfully for Linux (AppImage/deb)

### 4.2 Visual Checkpoints

1. **Initial State:** Timer shows 25:00, Start button enabled, Reset disabled
2. **Running State:** Timer counting down, Pause button visible, mode indicator highlighted
3. **Completed State:** Notification shown, next mode auto-selected
4. **Tray Minimized:** Window hidden, tray icon present with context menu
5. **Settings Expanded:** All settings visible with current values

---

## 5. Technical Requirements

- **Framework:** Tauri 2.x with React/Vue frontend
- **Minimum Rust:** 1.70+
- **Target Platforms:** Linux (X11/Wayland), Windows, macOS
- **Dependencies:**
  - `tauri` 2.x (core framework)
  - `tauri-plugin-notification` (notifications)
  - `tauri-plugin-log` (logging)
  - `serde` / `serde_json` (serialization)
  - `dirs` (config directory detection)