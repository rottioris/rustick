<!-- markdownlint-disable MD041 -->
<p align="center">
  <img src="docs/images/app-icon.png" alt="rustick" width="128" height="128">
</p>

<h1 align="center">🍅 Rustick</h1>

<p align="center">
  <a href="https://github.com/rottioris/rustick/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/rottioris/rustick/build.yml?style=flat&logo=github" alt="Build Status">
  </a>
  <a href="https://github.com/rottioris/rustick/releases/latest">
    <img src="https://img.shields.io/github/v/release/rottioris/rustick?style=flat" alt="Latest Release">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/rottioris/rustick?style=flat" alt="License: MIT">
  </a>
  <a href="https://tauri.app">
    <img src="https://img.shields.io/badge/Tauri-v2-blue?style=flat&logo=tauri" alt="Framework: Tauri v2">
  </a>
  <a href="https://github.com/rottioris/rustick/releases">
    <img src="https://img.shields.io/github/downloads/rottioris/rustick/total?style=flat" alt="Downloads">
  </a>
</p>

A cross-platform productivity timer application built with Tauri, React, and TypeScript. Stay focused and productive with customizable work/break intervals.

## 📥 Downloads

| OS | Method | Download |
|----|--------|----------|
| 🪟 Windows | Installer | [Rustick_x64-setup.exe](https://github.com/rottioris/rustick/releases/latest) |
| 🐧 Linux | AppImage | [Rustick_amd64.AppImage](https://github.com/rottioris/rustick/releases/latest) |
| 🐧 Linux | AUR | `yay -S rustick` or `paru -S rustick` |
| 🐧 Linux | .deb | [Rustick_amd64.deb](https://github.com/rottioris/rustick/releases/latest) |
| 🍎 macOS | DMG | [Rustick_aarch64.dmg](https://github.com/rottioris/rustick/releases/latest) |

> **Note**: For other architectures or portable versions, check the [Releases](https://github.com/rottioris/rustick/releases) page.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🍅 Productivity Timer | Three timer modes: Focus (25min), Short Break (5min), Long Break (15min) |
| 🔔 Native Notifications | System notifications when timer completes |
| 📊 Session Tracking | Track completed focus sessions per day |
| ⚙️ Customizable Settings | Adjust durations, auto-start, and sound preferences |
| 🖥️ System Tray | Run in background with quick controls |
| 💾 Persistent Settings | Settings auto-save to config file |
| 🌓 Theme Toggle | Switch between light/dark mode |
| 📱 Side Panel Settings | Settings open from right side panel |
| 🔄 Progress Ring | Animated circle shows timer progress |
| ⏱️ Dynamic Tooltip | Tray icon shows timer countdown when running |

### Timer Modes

| Mode | Default | Color | Purpose |
|------|---------|-------|--------|
| 🔴 Focus | 25 min | `#E74C3C` | Deep work sessions |
| 🟢 Short Break | 5 min | `#27AE60` | Quick rest |
| 🔵 Long Break | 15 min | `#3498DB` | Extended break after 4 sessions |

## 📸 Screenshots

| Dark Mode | Light Mode |
|-----------|-----------|
| ![Dark Mode](docs/images/screenshot-dark.png) | ![Light Mode](docs/images/screenshot-light.png) |

## 🚀 Quick Start

### Pre-built Binaries

Download from [Releases](https://github.com/rottioris/rustick/releases) or install via package manager:

```bash
# Linux (AppImage)
chmod +x Rustick_*.AppImage
./Rustick_*.AppImage

# Linux (AUR) - Arch Linux
yay -S rustick
# or
paru -S rustick

# Linux (.deb) - Debian/Ubuntu
sudo dpkg -i Rustick_*.deb
sudo apt-get install -f  # fix missing dependencies

# Windows
# Run the .exe installer

# macOS
# Open the .dmg and drag to Applications
```

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+

**Linux extra dependencies:**

```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3 librsvg2-tools patchelf

# Arch Linux
sudo pacman -S webkit2gtk-4.1 libappindicator3 librsvg patchelf
```

#### Build Steps

```bash
# Clone and enter directory
git clone https://github.com/rottioris/rustick.git
cd rst-timer

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Build for release
npm run tauri build
```

## 📖 Usage Guide

### Interface Overview

```
┌─────────────────────────┐
│ ☀️ 🍅 Rustick    ⚙️  │  ← Theme + Settings buttons
├─────────────────────────┤
│       ● Running         │  ← Status indicator
├─────────────────────────┤
│    ╭─────────────╮    │
│    │   25:00    │    │  ← Timer with progress ring
│    │   Focus    │    │  ← Mode label
│    ╰─────────────╯    │
├─────────────────────────┤
│ [Focus][Short][Long]   │  ← Mode selector buttons
├─────────────────────────┤
│                        │
│  [▶ Start] [Reset]     │  ← Control buttons
│                        │
├─────────────────────────┤
│  🍅 0 / 4 ○ ○ ○ ○    │  ← Session pills
└─────────────────────────┘
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start/Pause | `Space` (when focused) |
| Reset Timer | `R` key |
| Focus Mode | `1` key |
| Short Break | `2` key |
| Long Break | `3` key |

### Settings Panel

Click the ⚙️ button (top-right) to open the settings panel from the right side.

### System Tray Menu

Right-click the tray icon to access:

- **Show Window** - Display the main window
- **Start Timer** - Begin the current timer
- **Pause Timer** - Pause the running timer
- **Reset Timer** - Reset to initial state
- **Quit** - Exit the application

### Settings Configuration

The app creates a config file at:

| OS | Path |
|----|------|
| Linux | `~/.config/rustick/settings.json` |
| Windows | `%APPDATA%\rustick\settings.json` |
| macOS | `~/Library/Application Support/rustick/settings.json` |

**Settings JSON structure:**

```json
{
  "focus_duration": 25,
  "short_break_duration": 5,
  "long_break_duration": 15,
  "sessions_before_long_break": 4,
  "auto_start_breaks": false,
  "auto_start_pomodoros": false,
  "sound_enabled": true
}
```

## 🛠️ Development

### Project Structure

```
rustick/
├── src/                      # React frontend
│   ├── App.tsx               # Main component
│   ├── App.css               # Styles
│   ├── main.tsx             # Entry point
│   └── assets/              # Static assets
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs           # Application logic
│   │   └── main.rs          # Entry point
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   ├── capabilities/       # Permissions
│   └── icons/              # App icons
├── package.json             # Node dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json          # TypeScript config
└── CONTRIBUTING.md        # Contribution guide
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend |
| `npm run tauri dev` | Start Tauri in dev mode |
| `npm run tauri build` | Build for production |
| `npm run tauri icon` | Generate icons from source |

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Tauri v2](https://tauri.app) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 7](https://vite.dev) |
| Backend | [Rust](https://www.rust-lang.org/) |
| Styling | CSS (custom) |
| Packaging | NSIS (Windows), AppImage (Linux), DMG (macOS) |

## 🤝 Contributing

Contributions are welcome! Please read our contributing guides:

| Language | File |
|----------|------|
| English | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Español | [CONTRIBUTING.es.md](./CONTRIBUTING.es.md) |
| 日本語 | [CONTRIBUTING.ja.md](./CONTRIBUTING.ja.md) |

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🙏 Acknowledgments

- [Tauri](https://tauri.app) - Build truly native apps with web technologies
- [React](https://react.dev) - The library for web and native user interfaces
- [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) - Original productivity method

## 📬 Contact

- **Author**: [rottioris](https://github.com/rottioris)
- **Issues**: [Report a bug or request a feature](https://github.com/rottioris/rustick/issues)
- **Discussions**: [Start a discussion](https://github.com/rottioris/rustick/discussions)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/rottioris">rottioris</a>
</p>