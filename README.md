# MaxLaunchpad

**Launch apps with muscle memory, not mental effort.**

A keyboard-driven application launcher that maps programs to visual keyboard keys. Summon it with a global hotkey, then
launch any program with a single keystroke—like Vim for your desktop workflow.

![Screenshot](./docs/assets/screenshot.png)

## Features

- **Single keystroke launch** — Press any letter key to launch instantly; no typing, no searching
- **310 shortcuts** — 10 tabs × 30 keys + 10 global function keys (think: tmux sessions for apps)
- **Drag & drop setup** — Drag executables onto keys from your file manager
- **Cross-platform** — Windows, macOS, and Ubuntu with native look and feel
- **Portable configs** — Human-readable YAML profiles you can version, sync, or share
- **Global hotkey** — Summon from anywhere with <kbd>Alt</kbd> + <kbd>`</kbd> (configurable)

## Installation

Via Package Manager

```shell
# on Windows
winget install AwesomeDog.MaxLaunchpad
# on macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

Or

Download the installer from [Releases](https://github.com/AwesomeDog/maxlaunchpad/releases).

- **Windows** — Windows 10 or later. Works out of the box.
- **macOS** — macOS 11 (Big Sur) or later (Apple Silicon).
    - Run `xattr -cr /Applications/MaxLaunchpad.app` to remove quarantine.
    - You may need to manually add the app
      to [Login Items](https://support.apple.com/guide/mac-help/change-login-items-extensions-settings-mtusr003/mac) for
      auto-start.
- **Linux** — Ubuntu 24.04 or equivalent (Wayland).
    - Global hotkey may
      require [manual setup](https://help.ubuntu.com/stable/ubuntu-help/keyboard-shortcuts-set.html.en).

## User Guide

For installation, usage instructions, full feature list and FAQ, see the online manual:

- GitHub Pages: https://awesomedog.github.io/maxlaunchpad/
- In-repo entry point: ./docs/index.md

If you only want to use MaxLaunchpad, you can stop here. The rest of this README is primarily intended for developers
and contributors.

## Development (for contributors)

### Prerequisites

- Node.js 22+
- npm 10+

### Setup

```bash
git clone https://github.com/AwesomeDog/maxlaunchpad.git
cd maxlaunchpad
npm install
```

### Scripts

```bash
# Development
npm start # Run in dev mode with hot reload

# Build
npm run make:mac # Build macOS .app bundle
npm run make:win # Build Windows installer
npm run make:linux # Build Linux package

# Quality
npm run lint:fix # Auto-fix ESLint issues
npm test # Run Jest test suite

# Release
npm version patch && git push && git push --tags # Bump version & trigger CI
```

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.ts         # Entry point, lifecycle
│   ├── window.ts       # BrowserWindow management
│   ├── hotkey.ts       # Global hotkey registration
│   ├── configStore.ts  # YAML config read/write
│   ├── launcher.ts     # Program launching
│   ├── iconService.ts  # Icon extraction & caching
│   └── ...
├── preload/        # Bridge API (contextBridge)
├── renderer/       # React UI
│   ├── state/          # Context + useReducer store
│   ├── hooks/          # Custom hooks
│   ├── components/     # UI components
│   └── styles/         # CSS
└── shared/         # Shared types & constants
```

### Tech Stack

| Technology               | Usage                              |
|--------------------------|------------------------------------|
| Electron                 | Framework                          |
| React                    | UI (functional components + hooks) |
| TypeScript               | Language                           |
| Context + useReducer     | State management                   |
| js-yaml                  | Config parsing                     |
| zod                      | Runtime validation                 |
| Electron Forge + Webpack | Build                              |

### Architecture

**Three-layer design** — Classic Electron pattern with strict separation:

```
┌─────────────────────────────────────────────────────────────┐
│                 Main Process (Node.js)                      │
│  • App lifecycle & window management                        │
│  • Global hotkey registration (OS-level)                    │
│  • YAML config I/O & validation                             │
│  • Program launching & icon extraction                      │
└─────────────────────────────────────────────────────────────┘
                              ↕ IPC (type-safe)
┌─────────────────────────────────────────────────────────────┐
│                 Preload (Security Bridge)                   │
│  • Exposes window.electronAPI via contextBridge             │
│  • Acts as typed contract between layers                    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                 Renderer (React SPA)                        │
│  • Virtual keyboard UI & modal dialogs                      │
│  • Unified state via Context + useReducer                   │
│  • Zero direct Node.js access (sandboxed)                   │
└─────────────────────────────────────────────────────────────┘
```

### Configuration

All user data lives in `~/.config/MaxLaunchpad/`:

```
~/.config/MaxLaunchpad/
├── settings.yaml     # App settings
├── keyboard.yaml     # Default keyboard profile
├── caches/           # Icon cache
├── logs/             # App logs
├── styles/           # Custom CSS styles
└── backups/          # Auto-backups
```

**Schema details:** See [Product Specification](./docs/product/product-specification.md) for YAML structure and
validation rules.

## Documentation

- **[Product Specification](./docs/product/product-specification.md)** — Feature specs, configuration schema, UI/UX
  behavior
- **[Technical Architecture](./docs/tech/technical-architecture.md)** — Implementation details, state management, code
  patterns

## Credits

*MaxLaunchpad is a spiritual successor to the beloved but
now-discontinued [MaxLauncher](https://maxlauncher.sourceforge.io/). The project expands its legacy from Windows to
macOS and Ubuntu.*
