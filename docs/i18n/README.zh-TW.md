# MaxLaunchpad —— 鍵盤驅動的跨平台應用程式啟動器

> 用一個快捷鍵喚出虛擬鍵盤，再按一個鍵啟動應用程式。無需輸入、搜尋或等待模糊比對。

[English](../../README.md) · [简体中文](README.zh-CN.md) · **[繁體中文](README.zh-TW.md)（本頁）** · [Français](README.fr.md) · [Deutsch](README.de.md) · [日本語](README.ja.md) · [Русский](README.ru.md) · [Español](README.es.md) · [한국어](README.ko.md)

[![最新版本](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![下載量](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![平台](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![授權條款](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="MaxLaunchpad 虛擬鍵盤應用程式啟動器介面">
</p>

MaxLaunchpad 是一個免費、開源的 Windows、macOS 和 Linux 應用程式啟動器。它把應用程式綁定到虛擬鍵盤的按鍵上，從任何應用程式中透過全域快捷鍵喚出，再按一次鍵即可啟動目標程式。

## 功能總覽

- **確定性啟動**：每個按鍵永遠對應同一個應用程式，不受搜尋排序影響。
- **310 個快捷鍵**：10 個分頁，每頁 30 個按鍵，另有跨分頁共用的 `F1`–`F10`。
- **全域快捷鍵**：預設為 Windows/Linux 的 `Alt` + `` ` ``，macOS 的 `Option` + `` ` ``，也可以自行修改。
- **跨平台啟動**：支援可執行檔、捷徑、指令稿、應用程式包、`.desktop` 項目、URL，以及命令列參數與工作目錄。
- **拖放設定**：把 Explorer、Finder 或檔案管理員中的程式拖到按鍵上即可完成設定。
- **多設定檔**：使用 `keyboard.yaml`、`work.yaml`、`gaming.yaml` 等 YAML 檔案管理不同情境。
- **搜尋與快速選取**：在編輯對話方塊中搜尋已安裝的應用程式，自動填入名稱、路徑與描述。
- **主題與介面**：支援淺色、深色、跟隨系統主題、自訂 CSS、精簡模式、置頂與失焦自動隱藏。
- **系統匣**：可最小化到系統匣，也可以設定開機啟動與啟動時隱藏視窗。
- **免費開源**：基於 Electron、React 與 TypeScript，不需要帳號、雲端服務或遙測。

## 安裝

### 套件管理員

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### 直接下載

從 [Releases 發布頁](https://github.com/AwesomeDog/maxlaunchpad/releases) 下載對應系統的安裝程式。

| 平台 | 需求 | 備註 |
| --- | --- | --- |
| Windows | Windows 10 或更新版本 | 安裝後即可使用。 |
| macOS | macOS 11 Big Sur 或更新版本，Apple Silicon | 如果系統阻止開啟，可執行 `xattr -cr /Applications/MaxLaunchpad.app` 清除隔離標記。 |
| Linux | Ubuntu 24.04 或相容發行版 | 在 Wayland 下可能需要在 GNOME 鍵盤設定中手動設定全域快捷鍵。 |

## 60 秒快速開始

1. 啟動 MaxLaunchpad。虛擬鍵盤會顯示在螢幕上，應用程式也會出現在系統匣中。
2. 開啟 `View > Drag & Drop Mode`，讓視窗在設定時保持可見。
3. 從檔案管理員把應用程式拖到任意按鍵上，或在按鍵上按右鍵選擇 **Edit**，使用 **Quick Select** 搜尋應用程式。
4. 在數字鍵 `1`–`0` 上按右鍵，為分頁命名，例如 `Dev`、`Work`、`Games`。
5. 關閉拖放模式，在任何應用程式中按下預設的全域快捷鍵，再按目標按鍵即可啟動。

所有使用者資料預設儲存在：

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # 應用程式設定與全域快捷鍵
├── keyboard.yaml     # 預設鍵盤設定
├── caches/           # 圖示快取
├── logs/             # 應用程式日誌
├── styles/           # 自訂 CSS 主題
└── backups/          # 自動備份
```

如果設定了 `XDG_CONFIG_HOME`，上述路徑會隨之調整。可以把整個目錄放進 Git、Dropbox 或 Syncthing，在多台裝置之間同步啟動器設定。

## 鍵盤配置與快捷鍵

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   跨所有分頁共用的快捷鍵
1  2  3  4  5  6  7  8  9  0     切換分頁
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     每個分頁 30 個應用程式按鍵
Z  X  C  V  B  N  M  ,  .  /
```

| 快捷鍵 | 操作 |
| --- | --- |
| `Alt` + `` ` ``（macOS 為 `Option` + `` ` ``） | 顯示或隱藏 MaxLaunchpad |
| `F1`–`F10` | 啟動全域快捷鍵 |
| `Q`–`P`、`A`–`;`、`Z`–`/` | 啟動目前分頁上的應用程式 |
| `1`–`0` | 切換到對應分頁 |
| `←` / `→` | 切換上一個或下一個分頁 |
| `Ctrl+F` / `Cmd+F` | 搜尋所有快捷鍵 |
| `Esc` | 關閉對話方塊或隱藏視窗 |
| 在按鍵上按左鍵 | 啟動應用程式 |
| 在按鍵上按右鍵 | 開啟編輯、複製、剪下、貼上、刪除等選單 |
| 將檔案拖到按鍵上 | 設定該按鍵 |

## YAML 設定範例

```yaml
tabs:
  - id: '1'
    label: '開發'
  - id: '2'
    label: '工作'

keys:
  - tabId: '1'
    id: Q
    label: 終端機
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

每個快捷鍵還可以設定 `arguments`、`workingDirectory`、`runAsAdmin`、`description` 以及自訂圖示等欄位。完整範例請見 [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml)。

## 常見問題

**MaxLaunchpad 免費嗎？**  是的。專案採用 MIT 授權條款，免費且開源。

**支援 Windows 11 和 Apple Silicon 嗎？**  支援。Windows 11 屬於 Windows 10+ 範圍，macOS 安裝程式則針對 Apple Silicon。

**Linux / Wayland 能使用全域快捷鍵嗎？**  可以，但部分桌面環境需要在系統鍵盤設定中手動綁定快捷鍵。

**能啟動 Microsoft Store 應用程式、`.lnk` 捷徑和指令稿嗎？**  可以。Windows 支援 `.exe`、`.lnk`、`.bat`、`.cmd`、`.ps1`、UWP 與 `shell:`；macOS 支援 `.app`、Unix 可執行檔、`.sh`、`.command`；Linux 支援 ELF、`.desktop`、`.sh`、`.py` 與 `.rb`。

**日誌和備份在哪裡？**  位於 `~/.config/MaxLaunchpad/logs/` 與 `~/.config/MaxLaunchpad/backups/`。

## 文件與開發

- [線上文件](https://awesomedog.github.io/maxlaunchpad/)
- [FAQ](../faq/index.md)
- [使用者指南](../guide/index.md)
- [技術架構](../tech/technical-architecture.md)
- [國際化說明](../tech/i18n.md)

開發環境需要 Node.js `>=22.20.0`：

```shell
npm install
npm start       # 啟動開發環境
npm test        # 執行測試
npm run lint    # 執行 ESLint
npm run make    # 建置安裝程式
```

專案結構、貢獻流程與所有指令請參閱英文版 README 的[開發指南](../../README.md#development-guide-for-contributors)。歡迎提交問題回報與 Pull Request。

## 授權條款與致謝

MaxLaunchpad 使用 MIT 授權條款。它是已停止維護的 [MaxLauncher](https://maxlauncher.sourceforge.io/) 的精神續作，將鍵盤啟動工作流程擴展到 Windows、macOS 與 Ubuntu/Linux。
