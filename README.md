<div align="center">

# MaxLaunchpad — Keyboard-Driven App Launcher for Windows, macOS & Linux

**Launch any app with a single keystroke — muscle memory, not mental effort.**

MaxLaunchpad is a free, open-source **keyboard launcher** that maps your programs onto a
**virtual keyboard**. Summon it anywhere with a **global hotkey**, then press one key to launch.
No typing, no searching, no fuzzy-match roulette.

[![Latest release](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Downloads](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#install-maxlaunchpad-on-windows-macos-and-linux)
[![License](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-brightgreen)](https://awesomedog.github.io/maxlaunchpad/)
[![Stars](https://img.shields.io/github/stars/AwesomeDog/maxlaunchpad?style=social)](https://github.com/AwesomeDog/maxlaunchpad/stargazers)

**Languages:** **English** · [简体中文](docs/i18n/README.zh-CN.md) · [繁體中文](docs/i18n/README.zh-TW.md) · [Français](docs/i18n/README.fr.md) · [Deutsch](docs/i18n/README.de.md) · [日本語](docs/i18n/README.ja.md) · [Русский](docs/i18n/README.ru.md) · [Español](docs/i18n/README.es.md) · [한국어](docs/i18n/README.ko.md)

[Download](https://github.com/AwesomeDog/maxlaunchpad/releases) ·
[Documentation](https://awesomedog.github.io/maxlaunchpad/) ·
[Features](#features) ·
[FAQ](#faq) ·
[Contributing](#development-guide-for-contributors)

![MaxLaunchpad screenshot – a virtual keyboard application launcher showing app icons mapped to keyboard keys on Windows, macOS and Linux](./docs/assets/screenshot.png)

</div>

---

## Table of Contents

- [What is MaxLaunchpad?](#what-is-maxlaunchpad)
- [Why a keyboard launcher instead of a search launcher?](#why-a-keyboard-launcher-instead-of-a-search-launcher)
- [Features](#features)
- [Install MaxLaunchpad on Windows, macOS and Linux](#install-maxlaunchpad-on-windows-macos-and-linux)
- [Quick start in 60 seconds](#quick-start-in-60-seconds)
- [Virtual keyboard layout: 310 shortcuts](#virtual-keyboard-layout-310-shortcuts)
- [Keyboard shortcuts reference](#keyboard-shortcuts-reference)
- [YAML configuration example](#yaml-configuration-example)
- [Use cases](#use-cases)
- [MaxLaunchpad vs. Spotlight, Alfred, Raycast, Flow Launcher & Rofi](#maxlaunchpad-vs-spotlight-alfred-raycast-flow-launcher--rofi)
- [FAQ](#faq)
- [Documentation](#documentation)
- [Development guide (for contributors)](#development-guide-for-contributors)
- [Credits](#credits)

---

## What is MaxLaunchpad?

**MaxLaunchpad is a cross-platform application launcher for Windows, macOS and Ubuntu/Linux that
launches programs from a single keypress.** Instead of typing an app name and hoping the search
ranking picks the right result, you *assign* each program to a physical key — `Q` for your terminal,
`C` for Chrome, `V` for VS Code — and that binding never changes.

Think of it as **Vim for your desktop workflow**: deterministic, spatial, and fast enough that your
fingers stop asking your brain for permission.

- 🎯 **Deterministic** — the same key always launches the same app, forever.
- ⚡ **One keystroke** — `Alt` + `` ` `` to summon, one key to launch. Two presses total.
- 🧩 **310 shortcuts** — 10 tabs × 30 keys + 10 global function keys.
- 🗂 **Portable YAML** — human-readable profiles you can version with Git, sync, or share.
- 🖥 **Truly cross-platform** — one workflow across Windows, macOS and Ubuntu.
- 🆓 **Free & open source** — Electron + React + TypeScript, no account, no cloud, no telemetry hooks.

## Why a keyboard launcher instead of a search launcher?

Search-based launchers (Spotlight, Alfred, Raycast, Flow Launcher, Launchy, Wox, Rofi, Keypirinha)
ask you to **recall a name, type it, read the results, and confirm**. That is four cognitive steps
every single time, and the result list can change under you as indexes and rankings update.

MaxLaunchpad replaces recall with **muscle memory**:

| | Search launcher | MaxLaunchpad |
|---|---|---|
| Steps to launch | hotkey → type → scan → Enter | hotkey → **one key** |
| Result stability | ranking may change | **fixed binding, always** |
| Works with hands on home row | partially | **yes** |
| Arguments / working dir / admin | limited | **per-shortcut** |
| Config portability | app-specific DB | **plain YAML files** |

They are complementary, not mutually exclusive: keep your search launcher for one-off apps and files,
use MaxLaunchpad for the 20–50 programs you open every day.

## Features

### Launching
- **Single-keystroke launch** — press any letter/symbol key to launch instantly; no typing, no fuzzy search.
- **310 configurable shortcuts** — 10 tabs (`1`–`0`) × 30 keys, plus 10 global function keys (`F1`–`F10`) shared across all tabs.
- **Global hotkey** — summon from any app with `Alt` + `` ` `` (Windows/Linux) or `Option ⌥` + `` ` `` (macOS); modifiers and main key are fully configurable.
- **Arguments, working directory, run-as-admin** — per shortcut, so one key can launch a fully-parameterised command.
- **Launch anything**
  - Windows: `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, Microsoft Store / UWP apps, `shell:` targets
  - macOS: `.app` bundles, Unix executables, `.sh`, `.command`
  - Ubuntu/Linux: ELF binaries, `.desktop` entries, `.sh`, `.py`, `.rb`
  - All platforms: `http/https` URLs open in your default browser
- **Auto-hide after launch** — window disappears the moment the app starts.

### Configuration
- **Drag & drop setup** — drag an executable, shortcut or `.app` from your file manager onto a key. Windows `.lnk` files are parsed for target, arguments and working directory automatically.
- **Quick Select** — search installed applications inside the edit dialog to auto-fill label, path and description (with ↑/↓/Enter keyboard navigation).
- **Multiple profiles** — `keyboard.yaml`, `work.yaml`, `gaming.yaml`… switch via `File > New / Open / Save As`.
- **Human-readable YAML** — version it with Git, sync it with Dropbox/Syncthing, share it with your team.
- **Auto-save with timestamped backups** — every change is saved and the previous version is backed up.
- **Built-in search** — `Ctrl+F` / `Cmd+F` filters all keys by label, file path, arguments, working directory, description or key ID.

### Interface
- **System tray** — close button minimises to tray; optional *Start in Tray* and *Launch on Startup*.
- **Always on top, auto-hide on blur, lock-to-center** — behaves like an overlay, not another window to manage.
- **Multi-monitor & macOS Spaces aware** — appears on the display under your cursor and on the current Space.
- **Light / dark / system themes** plus **custom CSS styles** dropped into `~/.config/MaxLaunchpad/styles/`.
- **Compact mode** — hide the menu bar, button icons, button text, empty buttons or entire keyboard rows.
- **Real icons** — extracts and caches icons for Windows UWP/Store apps and macOS `.app` bundles, supports custom icon paths/URLs, and falls back to generated DiceBear avatars.

## Install MaxLaunchpad on Windows, macOS and Linux

### Package managers

```shell
# Windows (winget)
winget install AwesomeDog.MaxLaunchpad

# macOS (Homebrew Cask)
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### Direct download

Grab the installer for your OS from the [**Releases page**](https://github.com/AwesomeDog/maxlaunchpad/releases).

| Platform | Requirement | Notes |
|---|---|---|
| **Windows** | Windows 10 or later | Works out of the box. |
| **macOS** | macOS 11 Big Sur or later (Apple Silicon) | Run `xattr -cr /Applications/MaxLaunchpad.app` to clear the quarantine flag. Add the app to [Login Items](https://support.apple.com/guide/mac-help/change-login-items-extensions-settings-mtusr003/mac) for auto-start. |
| **Linux** | Ubuntu 24.04 or equivalent (Wayland) | Under Wayland the global hotkey may need [manual setup](https://help.ubuntu.com/stable/ubuntu-help/keyboard-shortcuts-set.html.en) in GNOME keyboard settings. |

## Quick start in 60 seconds

1. **Launch MaxLaunchpad.** The virtual keyboard appears; it also lives in your system tray.
2. **Enable `View > Drag & Drop Mode`** so the window stays visible while you configure it.
3. **Drag apps onto keys** from Explorer / Finder / Files — or right-click a key → **Edit** and use **Quick Select** to search installed apps.
4. **Name your tabs** (right-click a number key `1`–`0` → Edit): e.g. `Dev`, `Work`, `Media`, `Games`.
5. **Turn off Drag & Drop Mode**, press `Alt` + `` ` `` from anywhere, then press your key. Done.

> Tip: everything is stored in `~/.config/MaxLaunchpad/`. Put that folder in a Git repo and your
> launcher setup follows you to every machine.

## Virtual keyboard layout: 310 shortcuts

```
┌─────────────────────────────────────────┐
│ F1  F2  F3  F4  F5  F6  F7  F8  F9  F10 │  Function keys — global, shared across all tabs
├─────────────────────────────────────────┤
│  1   2   3   4   5   6   7   8   9   0  │  Tab selectors — click or press to switch
├─────────────────────────────────────────┤
│  Q   W   E   R   T   Y   U   I   O   P  │
│  A   S   D   F   G   H   J   K   L   ;  │  Letter/symbol keys — 30 per tab
│  Z   X   C   V   B   N   M   ,   .   /  │
└─────────────────────────────────────────┘

10 global function keys + (10 tabs × 30 keys) = 310 shortcuts
```

Tabs work like **tmux sessions for your applications**: one tab per context — `Dev`, `Design`,
`Ops`, `Games` — each with its own full set of 30 bindings.

## Keyboard shortcuts reference

| Shortcut | Action |
|---|---|
| `Alt` + `` ` `` (`⌥` + `` ` `` on macOS) | Show / hide MaxLaunchpad (configurable) |
| `F1` – `F10` | Launch a global shortcut (works on every tab) |
| `Q`–`P`, `A`–`;`, `Z`–`/` | Launch the shortcut on the active tab |
| `1` – `0` | Switch to tab 1–10 |
| `←` / `→` | Previous / next tab |
| Mouse scroll over the keyboard | Previous / next tab |
| `Ctrl+F` / `Cmd+F` | Search all shortcuts |
| `Esc` | Close dialog, or hide the window |
| Left-click a key | Launch program |
| Right-click a key | Context menu (Edit / Copy / Cut / Paste / Delete / Open file location) |
| Drop a file on a key | Configure that key |
| `Alt` (tap) | Reveal the menu bar when it is hidden |

## YAML configuration example

All user data lives in `~/.config/MaxLaunchpad/` on **every** platform (honouring `XDG_CONFIG_HOME`):

```
~/.config/MaxLaunchpad/
├── settings.yaml     # App settings & global hotkey (one per machine)
├── keyboard.yaml     # Default keyboard profile
├── work.yaml         # Additional profiles you create
├── caches/           # Icon cache
├── logs/             # Application logs
├── styles/           # Custom CSS themes
└── backups/          # Timestamped auto-backups
```

**`keyboard.yaml`** — key bindings and tab labels:

```yaml
tabs:
  - id: '1'
    label: 'Dev'
  - id: '2'
    label: 'Work'

keys:
  - tabId: 'F'            # 'F' = global function-key row
    id: F1
    label: Help
    filePath: 'C:\Windows\HelpPane.exe'

  - tabId: '1'
    id: Q
    label: Calculator
    filePath: 'C:\Windows\system32\calc.exe'
    description: Launch Calculator

  - tabId: '1'
    id: O
    label: OutlookStoreApp   # Microsoft Store / UWP app
    filePath: explorer.exe
    arguments: shell:appsFolder\Microsoft.OutlookForWindows_8wekyb3d8bbwe!App
```

**`settings.yaml`** — hotkey, theme, window and UI preferences:

```yaml
hotkey:
  modifiers: [Alt]
  key: '`'
activeTabOnShow: lastUsed
lockWindowCenter: true
launchOnStartup: true
startInTray: true
theme: system          # light | dark | system
customStyle: default   # CSS file name in styles/, without ".css"
windowSize: { width: 1000, height: 600 }
hideElements:
  menu: false
  buttonIcons: false
  buttonText: false
  emptyButtons: false
  rowF: false
  row1: false
  row2: false
  row3: false
```

Full schema, validation rules and every option: **[Product Specification](./docs/product/product-specification.md)**.

## Use cases

- **Developers** — one tab per stack: IDE, terminal, DB client, API client, log viewer, local docs.
- **Sysadmins / DevOps** — RDP/SSH sessions, admin consoles and PowerShell scripts with pre-baked arguments and *Run as Admin*.
- **Gamers** — a `Games` tab of launchers, mod managers, overlays and voice chat.
- **Creators** — Photoshop, DaVinci, OBS, stream deck-style shortcuts without buying a stream deck.
- **Keyboard purists** — never touch the mouse, the Dock, the Start menu or the taskbar again.
- **Multi-machine users** — commit your YAML profile to Git and reproduce your exact workflow on a new laptop in seconds.

## MaxLaunchpad vs. Spotlight, Alfred, Raycast, Flow Launcher & Rofi

| | MaxLaunchpad | Spotlight / Alfred / Raycast | Flow Launcher / Wox / Keypirinha / Launchy | Rofi / dmenu |
|---|---|---|---|---|
| Interaction model | **Fixed key → app** | Type & search | Type & search | Type & search |
| Keystrokes to launch | **1** (after hotkey) | 3–8 | 3–8 | 3–8 |
| Windows | ✅ | Alfred/Raycast ❌ | ✅ | ❌ |
| macOS | ✅ | ✅ | ❌ | ❌ |
| Linux | ✅ (Ubuntu/Wayland) | ❌ | ❌ | ✅ |
| Visual, spatial layout | ✅ virtual keyboard | ❌ | ❌ | ❌ |
| Plain-text portable config | ✅ YAML | ❌ | partial | ✅ |
| Open source | ✅ | ❌ (mostly) | ✅ | ✅ |

If you loved the discontinued Windows-only **MaxLauncher**, MaxLaunchpad is the modern,
cross-platform continuation of that idea.

## FAQ

### Is MaxLaunchpad free and open source?
Yes. It is an open-source Electron/React/TypeScript desktop app, free for personal and commercial use.

### Does it work on Windows 11?
Yes — Windows 10 and Windows 11 are supported.

### Does it run on Apple Silicon Macs?
Yes, macOS 11 Big Sur or later on Apple Silicon. After installing, run
`xattr -cr /Applications/MaxLaunchpad.app` to remove the quarantine attribute.

### Does the global hotkey work on Linux / Wayland?
MaxLaunchpad targets Ubuntu 24.04 (Wayland). Because Wayland restricts global shortcut
registration, you may need to bind the hotkey through GNOME's own keyboard-shortcut settings.

### Can I sync my launcher configuration between computers?
Yes. Everything lives in plain YAML under `~/.config/MaxLaunchpad/`. Commit it to Git, sync it with
Dropbox/OneDrive/Syncthing, or copy a single profile file to another machine.

### How many shortcuts can I create?
310: ten function keys shared globally, plus ten tabs of thirty letter/symbol keys each.

### Can it launch Microsoft Store (UWP) apps, `.lnk` shortcuts or shell scripts?
Yes — `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, `shell:` targets and Store/UWP apps on Windows;
`.app` bundles and shell scripts on macOS; ELF binaries, `.desktop` files, `.sh`, `.py` and `.rb`
on Linux. URLs open in your default browser.

### Can a shortcut pass command-line arguments or run as administrator?
Yes. Every shortcut supports arguments, a working directory, a custom icon, a tooltip description,
and *Run as Admin* on Windows.

### Is it a replacement for MaxLauncher?
It is a spiritual successor to the discontinued
[MaxLauncher](https://maxlauncher.sourceforge.io/), rebuilt from scratch with modern tooling and
extended from Windows to macOS and Ubuntu. Profiles use MaxLaunchpad's own YAML format.

### Where are logs and backups stored?
`~/.config/MaxLaunchpad/logs/` and `~/.config/MaxLaunchpad/backups/`. A backup is written before
each save whenever the profile content has changed.

## Documentation

Full manual — installation, usage, every setting, troubleshooting and FAQ:

- 📖 **Online manual:** <https://awesomedog.github.io/maxlaunchpad/>
- 📁 **In-repo entry point:** [`./docs/index.md`](./docs/index.md)
- 📐 **[Product Specification](./docs/product/product-specification.md)** — feature specs, YAML schema, UI/UX behaviour
- 🏗 **[Technical Architecture](./docs/tech/technical-architecture.md)** — implementation details, state management, code patterns

> If you only want to *use* MaxLaunchpad, you can stop here. Everything below is for developers and contributors.

---

## Development guide (for contributors)

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
npm start                                        # Dev mode with hot reload

# Build
npm run make:mac                                 # macOS .app bundle
npm run make:win                                 # Windows installer
npm run make:linux                               # Linux package

# Quality
npm run lint:fix                                 # Auto-fix ESLint issues
npm test                                         # Jest test suite

# Release
npm version patch && git push && git push --tags # Bump version & trigger CI
```

### Tech stack

| Technology | Usage |
|---|---|
| Electron | Application framework |
| React | UI (functional components + hooks) |
| TypeScript | Language |
| Context + useReducer | State management |
| js-yaml | Config parsing |
| zod | Runtime validation |
| Electron Forge + Webpack | Build & packaging |

<details>
<summary><strong>Project structure</strong></summary>

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

</details>

<details>
<summary><strong>Architecture — three-layer Electron design</strong></summary>

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

</details>

### Contributing

Issues, feature requests and pull requests are welcome. Bug reports that include your OS version,
MaxLaunchpad version and the relevant lines from `~/.config/MaxLaunchpad/logs/maxlaunchpad.log`
are the most useful.

If MaxLaunchpad saves you keystrokes, please ⭐ **star the repo** — it is the main way other
keyboard-driven people find it.

## Credits

MaxLaunchpad is a spiritual successor to the beloved but now-discontinued
[MaxLauncher](https://maxlauncher.sourceforge.io/), expanding its legacy from Windows to macOS and
Ubuntu.

---

<sub>**Keywords:** keyboard launcher · application launcher · app launcher for Windows / macOS / Linux ·
quick launch tool · global hotkey launcher · keyboard shortcuts manager · program launcher ·
virtual keyboard launcher · MaxLauncher alternative · Launchy / Alfred / Raycast / Flow Launcher alternative ·
Electron desktop app · productivity tool</sub>
