# MaxLaunchpad Product Specification

> **Product Type**: Desktop Application Launcher  
> **Platforms**: Windows, macOS, Ubuntu (latest)  
> **Tech Stack**: Electron, React, TypeScript, Functional Components & Hooks, Unified State Management

## 1. Product Overview

MaxLaunchpad is a keyboard-driven application launcher that lets you bind programs to keys on a virtual keyboard, invoke
the launcher via a global hotkey, and launch programs with a single keystroke or click.

Simple, reliable, and deliberately restrained, it focuses on one thing: making your most-used applications instantly
accessible from the keyboard, so your muscle memory can do the work—no distractions, no bloat.

**Key Capabilities**:

- 10 tabs (number keys `1`–`0`), each with 30 configurable letter/symbol keys
- 10 global function keys (`F1`–`F10`) shared across all tabs
- Total: 310 configurable shortcuts (10 global + 30×10 per-tab)
- Drag & Drop configuration from file manager
- System tray integration with auto-hide when the window loses focus

---

## 2. Virtual Keyboard Layout

```
┌─────────────────────────────────────────┐
│ F1  F2  F3  F4  F5  F6  F7  F8  F9  F10 │  Function keys (global, shared across tabs)
├─────────────────────────────────────────┤
│  1   2   3   4   5   6   7   8   9   0  │  Tab selectors (click/press to switch)
├─────────────────────────────────────────┤
│  Q   W   E   R   T   Y   U   I   O   P  │
│  A   S   D   F   G   H   J   K   L   ;  │  Letter/symbol keys (per-tab config)
│  Z   X   C   V   B   N   M   ,   .   /  │
└─────────────────────────────────────────┘
```

**Zones**:

- **Function Keys (F1–F10)**: Global configuration, same across all tabs
- **Number Keys (1–0)**: Tab selectors, clicking switches the active tab
- **Letter/Symbol Keys (30 keys)**: Per-tab configuration, changes with active tab

---

## 3. Configuration System

### 3.1 Storage Location

All platforms: `~/.config/MaxLaunchpad/` (respects `XDG_CONFIG_HOME` if set)

Directory structure:

```
~/.config/MaxLaunchpad/
├── settings.yaml         # App settings (one per machine)
├── keyboard.yaml         # Default keyboard profile (used when settings.yaml.activeProfilePath is absent)
├── work.yaml             # Additional keyboard profile (user-created)
├── caches/               # Icon cache files
├── logs/                 # App logs
│   └── maxlaunchpad.log  
├── styles/               # Custom styles location
│   └── default.css       # Default style
└── backups/              # Backup location
    └── xxxx.{tag}-YYYYMMDDHHmmss.yaml  # tag: 'backup' or 'corrupted'
```

### 3.2 Bootstrap Behavior

On first startup, if the config directory is empty:

- Recursively copy `./resources/config-templates/` to `~/.config/MaxLaunchpad/`

### 3.3 Keyboard Profile (`keyboard.yaml` and other profile files like `work.yaml`, `gaming.yaml`)

Stores key bindings and tab labels. Multiple profile files are supported (for example, `work.yaml` and `gaming.yaml`).

**Type Definitions**:

```typescript
interface KeyConfig {
    tabId: string;              // '1'-'9', '0' for letter keys, 'F' for function keys
    id: string;                 // Key ID: 'Q'-'P', 'A'-';', 'Z'-'/', 'F1'-'F10'
    label: string;              // Display text
    filePath: string;           // Program path (required)
    arguments?: string;         // Command line arguments
    workingDirectory?: string;  // Working directory
    description?: string;       // Tooltip text
    runAsAdmin?: boolean;       // Windows only
    iconPath?: string;          // Custom icon path
}

interface TabConfig {        // Tab selectors (aka number keys)
    id: string;      // '1'-'9', '0'
    label: string;   // Display name (can be empty string)
}

interface KeyboardProfile {
    tabs: TabConfig[];
    keys: KeyConfig[];  // Can be empty array
}
```

**Example**:

```yaml
tabs:
  - id: '1'
    label: 'Fav'
  - id: '2'
    label: 'Work'
  # Tabs 3-0 omitted

keys:
  - tabId: 'F'
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
    label: OutlookStoreApp
    filePath: explorer.exe
    arguments: shell:appsFolder\Microsoft.OutlookForWindows_8wekyb3d8bbwe!App
```

### 3.4 App Settings (`settings.yaml`, one per machine)

A single settings file per machine that stores application settings and the global hotkey configuration.

**Type Definitions**:

```typescript
interface HotkeyConfig {
    modifiers: string[];
    key: string;
}

interface AppSettings {
    hotkey: HotkeyConfig;
    activeTabOnShow: 'lastUsed' | string;  // 'lastUsed' or tab ID '1'-'0'
    activeProfilePath: string;             // Absolute path to active keyboard profile file
    lockWindowCenter: boolean;             // Default: true
    launchOnStartup: boolean;              // "Launch on Startup", default: true
    startInTray: boolean;                  // "Start in Tray (Minimized)", default: false
    theme: 'light' | 'dark' | 'system';    // "Theme", default: 'system'
    customStyle: string;                   // "Custom Style", style name without ".css", default: 'default'
}
```

**Example**:

```yaml
hotkey:
  modifiers:
    - Alt
  key: '`'
activeTabOnShow: lastUsed
lockWindowCenter: true
launchOnStartup: true
startInTray: true
theme: system
customStyle: default
```

### 3.5 Auto-Save and Backup

- **Auto-save**: Triggered when the profile or settings change, with an optional 1-second debounce
- **Backup**: (profile files only) Before each save, create a backup only if the content has changed
- **Backup filename**: `${profileBaseName}.{tag}-YYYYMMDDHHmmss.yaml`

---

## 4. Window Management

### 4.1 Properties

- **Size**: 1000 × 600 pixels (fixed)
- **Title**: `MaxLaunchpad - ${activeProfilePath}` (adds a `*` suffix when there are unsaved changes)
- **Always on Top**: Yes
- **Menu Bar**: Custom in-window menu (not native OS menu)

### 4.2 Behaviors

| Behavior              | Description                                                                  |
|-----------------------|------------------------------------------------------------------------------|
| Auto-hide on blur     | Window hides when losing focus (disabled when "Drag & Drop Mode" is enabled) |
| Lock Window Center    | When enabled: auto-centers on show, disables window dragging                 |
| Close button          | Minimizes to tray (does not exit)                                            |
| Workspaces support    | macOS: Window appears on current virtual desktop (Space) when invoked        |
| Multi-monitor support | Window appears on the monitor where the cursor is located when invoked       |

---

## 5. Global Hotkey

**Default**: `Alt` + `` ` `` (backtick) (Windows/Ubuntu) / `Option (⌥)` + `` ` `` (macOS)

**Behavior**:

- Toggles window visibility (show/hide)
- Supports dynamic re-registration at runtime
- Configurable modifiers and main key

**Modifiers by Platform**:

- **Windows/Ubuntu**: Ctrl, Alt, Shift, Win
- **macOS**: Control (⌃), Option (⌥), Shift (⇧), Command (⌘)
- **Storage format**: Uses unified cross-platform identifiers: `Ctrl`, `Alt`, `Shift`, `Win`

---

## 6. Menu Bar

### File

| Item     | Action                                                                        |
|----------|-------------------------------------------------------------------------------|
| New      | Save current profile, prompt for new file path, create empty keyboard profile |
| Open…    | Open keyboard profile via file dialog                                         |
| Save As… | Save keyboard profile to new file                                             |
| Exit     | Exit application                                                              |

The **New/Open/Save As** functions apply **only** to **keyboard profile files**,
and update `activeProfilePath` field in `settings.yaml`, which is the single source of truth for the currently active
keyboard profile file path.

The menu bar implements **Sticky Menu** behavior.

### View

| Item               | Action                                                                           |
|--------------------|----------------------------------------------------------------------------------|
| Drag & Drop Mode   | See section 14, "Drag & Drop Configuration"                                      |
| Lock Window Center | Toggle: when enabled, window centers and can't be dragged. Show this as tooltip. |

### Tools (Platform-specific)

**Windows**:

| Item                        | Path                                                  |
|-----------------------------|-------------------------------------------------------|
| Open Start Menu (User)      | `%AppData%\Microsoft\Windows\Start Menu\Programs`     |
| Open Start Menu (All Users) | `%ProgramData%\Microsoft\Windows\Start Menu\Programs` |

**macOS**:

| Item                              | Path             |
|-----------------------------------|------------------|
| Open Applications Folder (User)   | `~/Applications` |
| Open Applications Folder (System) | `/Applications`  |

**Ubuntu**:

| Item                                 | Path                           |
|--------------------------------------|--------------------------------|
| Open Applications Directory (User)   | `~/.local/share/applications/` |
| Open Applications Directory (System) | `/usr/share/applications/`     |

**All Platforms**:

| Item                   | Path                                                     |
|------------------------|----------------------------------------------------------|
| Open My Config Folders | `~/.config/MaxLaunchpad/` and keyboard profile file path |

### Settings

| Item    | Action                      |
|---------|-----------------------------|
| Hotkey  | Open hotkey settings dialog |
| Options | Open options dialog         |

### Help

| Item               | Action                                                                  |
|--------------------|-------------------------------------------------------------------------|
| Documentation      | Open documentation website in browser                                   |
| About MaxLaunchpad | Open About dialog with app information, including current Git commit ID |

---

## 7. System Tray

**Menu Items**:

- **Show**: Show main window
- **Exit**: Exit application

---

## 8. Context Menus

All popup menus must auto-reposition to stay fully visible within the window.

### 8.1 Key Context Menu (Function/Letter Keys)

| Item               | Action                             |
|--------------------|------------------------------------|
| Edit               | Open key edit modal                |
| Copy               | Copy key config to clipboard       |
| Cut                | Copy and clear key config          |
| Paste              | Apply clipboard config to key      |
| Delete             | Clear key config                   |
| Open File Location | Open file location in file manager |

Copy/Cut/Paste use an internal single-item runtime clipboard (shared across tabs) rather than the system clipboard.

### 8.2 Tab Context Menu (Number Keys)

| Item | Action              |
|------|---------------------|
| Edit | Open tab edit modal |

---

## 9. Edit Modals

### 9.1 Key Edit Modal Fields

| Field             | Type         | Required | Note                                                                                                                   |
|-------------------|--------------|----------|------------------------------------------------------------------------------------------------------------------------|
| Quick Select      | search input | No       | Search installed apps to auto-fill Label, File Path, and Description. Supports keyboard navigation (↑/↓/Enter/Escape). |
| Label             | string       | Yes      | Display text                                                                                                           |
| File Path         | string       | Yes      | Program path                                                                                                           |
| Arguments         | string       | No       | Command line args                                                                                                      |
| Working Directory | string       | No       | -                                                                                                                      |
| Description       | string       | No       | Tooltip                                                                                                                |
| Run as Admin      | boolean      | No       | Windows only                                                                                                           |
| Icon Path         | string       | No       | Custom icon (local path or URL)                                                                                        |

### 9.2 Tab Edit Modal Fields

| Field     | Type   |
|-----------|--------|
| Tab Label | string |

---

## 10. Hotkey Settings Dialog

**Configurable Items**:

1. **Modifiers**: Multi-select list bound to `hotkey.modifiers`.
2. **Main Key**: Press-to-record input bound to `hotkey.key`.
3. **Active Tab on Show**: Dropdown bound to `activeTabOnShow` ("lastUsed" or a specific tab `1`–`0`).

All changes are applied immediately via the auto-save mechanism. The dialog provides a single **Close** button that only
dismisses the dialog and does not gate whether changes are stored.  
See **Global Hotkey** and **App Settings** sections for semantics and default values.

---

## 11. Options Dialog

| Setting                   | Description                                                                                 |
|---------------------------|---------------------------------------------------------------------------------------------|
| Launch on Startup         | Launch MaxLaunchpad on startup (uses `auto-launch` library)                                 |
| Start in Tray (Minimized) | Start in system tray instead of showing the main window                                     |
| Theme                     | See Theme System for details                                                                |
| Custom Style              | Select CSS file from `~/.config/MaxLaunchpad/styles/` (store name without `.css` extension) |

All changes are applied immediately to the UI via the auto-save mechanism. The dialog provides a single **Close** button
that only dismisses the dialog and does not gate whether changes are stored.

---

## 12. Keyboard Navigation

### 12.1 Tab Switching

- Number keys `1`–`0`: Direct tab switch
- Arrow keys `←`/`→`: Previous/next tab (stops at boundaries: `←` from tab `1` does nothing; `→` from tab `0` does
  nothing)
- Mouse scroll over keyboard area: Previous/next tab (stops at boundaries, same behavior as arrow keys)

### 12.2 Program Launch

- Function keys `F1`–`F10`: Launch global shortcuts
- Letter/symbol keys: Launch current tab shortcuts (case-insensitive)
- Window auto-hides after successful launch (disabled in Drag & Drop Mode)

### 12.3 Quick Operations

- `Esc`: Close modal, or hide window if no modal open

### 12.4 Summary of Key Interactions

| Action               | Result            |
|----------------------|-------------------|
| Left-click key       | Launch program    |
| Right-click key      | Open context menu |
| Drop file on key     | Configure key     |
| Scroll over keyboard | Switch tabs       |

---

## 13. Search Feature

**Invocation**: `Ctrl+F` (Windows/Ubuntu) / `Cmd+F` (macOS)

**Location**: inside the menu bar, aligned to the right, with a clear button at the end

**Search Scope**: label, filePath, arguments, workingDirectory, description, key ID

**Behavior**: Real-time filtering; non-matching keys and tabs are hidden. Clearing the search box restores the full key
view.

---

## 14. Drag & Drop Configuration

### 14.1 Workflow

1. User drags file from file manager to a key
2. Show drag indicator on dragover
3. On drop, extract file info:
    - `filePath`: Full path
    - `label`: Filename without extension
    - `description`: Full path
    - Windows `.lnk`: Also extract target, arguments, workingDirectory
4. Update config and auto-save

### 14.2 Drag & Drop Mode

Menu: `View > Drag & Drop Mode`

- When enabled:
    - Window doesn't auto-hide on blur
    - Window is no longer always-on-top (allows dragging files from windows behind)
    - Window becomes movable (overrides Lock Window Center if enabled)
- **Runtime-only state**: Not persisted to settings; resets to disabled on app restart
- Must be manually disabled after use
- Tooltip on hover: When enabled, the window stays visible and movable in this session

---

## 15. Program Launch

### 15.1 Supported File Types

| Platform | Types                                                       |
|----------|-------------------------------------------------------------|
| Windows  | `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, store app, `shell:` |
| macOS    | `.app`, Unix executables, `.sh`, `.command`                 |
| Ubuntu   | ELF binaries, `.desktop`, `.sh`, `.py`, `.rb`               |
| All      | URLs (http/https) — open in the default browser             |

### 15.2 Platform-Specific Requirements

**Windows**:

- Parse `.lnk` shortcuts to extract target, arguments, workingDirectory
- Run as Admin: `Start-Process -FilePath '...' -Verb RunAs`

**macOS**:

- Launch with: `open -a "AppName.app" --args arg1 arg2`

---

## 16. Icon System

### 16.1 Retrieval Methods

Supports macOS `.app` and Windows UWP/Store apps

### 16.2 Caching

- Cache key: MD5 hash of related attributes (e.g., UWP/Store apps)
- Layers: File system cache (expires after around 30 days) + in-memory cache
- Fallback: Generated avatar using DiceBear Initials (`@dicebear/collection`) based on the basename of
  `keyConfig.filePath`

---

## 17. Theme System

### 17.1 Theme Modes

- **System**: Follow OS theme, update in real-time
- **Light**: Force light theme
- **Dark**: Force dark theme

### 17.2 CSS Variables

```css
/* Light */
:root {
    --background-color: #FAFAFA;
    --selected-background-color: #E3F2FD;
    --text-color: #212121;
}

/* Dark */
:root.dark-mode {
    --background-color: #121212;
    --selected-background-color: #1E3A5F;
    --text-color: #E0E0E0;
}
```

### 17.3 Custom Styles

- Create `.css` file, select in `Settings > Options > Custom Style`
- Stored in `settings.yaml` as `customStyle` (style name without `.css` extension)

---

## 18. Application Behaviors

### 18.1 Single Instance

- Only one instance allowed
- Second launch activates existing window

### 18.2 Error Handling

- Global uncaught error handling
- Log errors for diagnostics
- Display native system dialog when operations fail (e.g., config load/save errors, program launch failures)

