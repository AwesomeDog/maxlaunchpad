# MaxLaunchpad —— 键盘驱动的跨平台应用启动器

> 用一个快捷键唤出虚拟键盘，再按一个键启动应用。无需输入、搜索或等待模糊匹配。

[English](../../README.md) · **简体中文（本页）** · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [日本語](README.ja.md) · [Русский](README.ru.md) · [Español](README.es.md) · [한국어](README.ko.md)

[![最新版本](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![下载量](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![平台](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#安装)
[![许可证](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="MaxLaunchpad 虚拟键盘应用启动器界面">
</p>

MaxLaunchpad 是一个免费、开源的 Windows、macOS 和 Linux 应用启动器。它把应用绑定到虚拟键盘的按键上，从任意应用中通过全局快捷键唤出，再按一次键即可启动目标程序。

## 功能概览

- **确定性启动**：每个按键始终对应同一个应用，不受搜索排序影响。
- **310 个快捷键**：10 个标签页，每页 30 个按键，另有跨标签页共享的 `F1`–`F10`。
- **全局快捷键**：默认使用 Windows/Linux 的 `Alt` + `` ` ``，macOS 的 `Option` + `` ` ``，也可以自行修改。
- **跨平台启动**：支持可执行文件、快捷方式、脚本、应用包、`.desktop` 条目、URL，以及命令行参数和工作目录。
- **拖放配置**：把 Explorer、Finder 或文件管理器中的程序拖到按键上即可配置。
- **多配置文件**：使用 `keyboard.yaml`、`work.yaml`、`gaming.yaml` 等 YAML 文件管理不同场景。
- **搜索与快速选择**：在编辑对话框中搜索已安装应用，自动填写名称、路径和描述。
- **主题与界面**：支持浅色、深色、跟随系统主题、自定义 CSS、紧凑模式、置顶和失焦自动隐藏。
- **系统托盘**：可最小化到托盘，也可以设置开机启动和启动时隐藏窗口。
- **免费开源**：基于 Electron、React 和 TypeScript，不需要账号、云服务或遥测。

## 安装

### 包管理器

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### 直接下载

从 [Releases 发布页](https://github.com/AwesomeDog/maxlaunchpad/releases) 下载对应系统的安装包。

| 平台 | 要求 | 说明 |
| --- | --- | --- |
| Windows | Windows 10 或更高版本 | 安装后即可使用。 |
| macOS | macOS 11 Big Sur 或更高版本，Apple Silicon | 如果系统阻止打开，可执行 `xattr -cr /Applications/MaxLaunchpad.app` 清除隔离标记。 |
| Linux | Ubuntu 24.04 或兼容发行版 | Wayland 下可能需要在 GNOME 键盘设置中手动配置全局快捷键。 |

## 60 秒快速开始

1. 启动 MaxLaunchpad。虚拟键盘会显示在屏幕上，应用也会出现在系统托盘中。
2. 打开 `View > Drag & Drop Mode`，让窗口在配置时保持可见。
3. 从文件管理器把应用拖到任意按键上，或右键按键选择 **Edit**，使用 **Quick Select** 搜索应用。
4. 右键数字键 `1`–`0`，为标签页命名，例如 `Dev`、`Work`、`Games`。
5. 关闭拖放模式，在任意应用中按默认全局快捷键，再按目标按键即可启动。

所有用户数据默认保存在：

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # 应用设置和全局快捷键
├── keyboard.yaml     # 默认键盘配置
├── caches/           # 图标缓存
├── logs/             # 应用日志
├── styles/           # 自定义 CSS 主题
└── backups/          # 自动备份
```

如果设置了 `XDG_CONFIG_HOME`，上述路径会相应调整。可以把整个目录放进 Git、Dropbox 或 Syncthing，在多台设备之间同步启动器配置。

## 键盘布局和快捷键

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   跨所有标签页共享的快捷键
1  2  3  4  5  6  7  8  9  0     切换标签页
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     每个标签页 30 个应用按键
Z  X  C  V  B  N  M  ,  .  /
```

| 快捷键 | 操作 |
| --- | --- |
| `Alt` + `` ` ``（macOS 为 `Option` + `` ` ``） | 显示或隐藏 MaxLaunchpad |
| `F1`–`F10` | 启动全局快捷键 |
| `Q`–`P`、`A`–`;`、`Z`–`/` | 启动当前标签页上的应用 |
| `1`–`0` | 切换到对应标签页 |
| `←` / `→` | 切换上一个或下一个标签页 |
| `Ctrl+F` / `Cmd+F` | 搜索所有快捷键 |
| `Esc` | 关闭对话框或隐藏窗口 |
| 左键点击按键 | 启动应用 |
| 右键点击按键 | 打开编辑、复制、剪切、粘贴、删除等菜单 |
| 将文件拖到按键上 | 配置该按键 |

## YAML 配置示例

```yaml
tabs:
  - id: '1'
    label: '开发'
  - id: '2'
    label: '工作'

keys:
  - tabId: '1'
    id: Q
    label: 终端
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

每个快捷键还可以配置 `arguments`、`workingDirectory`、`runAsAdmin`、`description` 和自定义图标等字段。完整示例见 [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml)。

## 常见问题

**MaxLaunchpad 免费吗？**  是。项目采用 MIT 许可证，免费且开源。

**支持 Windows 11 和 Apple Silicon 吗？**  支持。Windows 11 属于 Windows 10+ 范围，macOS 安装包面向 Apple Silicon。

**Linux / Wayland 能使用全局快捷键吗？**  可以，但部分桌面环境需要在系统键盘设置中手动绑定快捷键。

**能启动 Microsoft Store 应用、`.lnk` 文件和脚本吗？**  可以。Windows 支持 `.exe`、`.lnk`、`.bat`、`.cmd`、`.ps1`、UWP 和 `shell:`；macOS 支持 `.app`、Unix 可执行文件、`.sh`、`.command`；Linux 支持 ELF、`.desktop`、`.sh`、`.py` 和 `.rb`。

**日志和备份在哪里？**  位于 `~/.config/MaxLaunchpad/logs/` 和 `~/.config/MaxLaunchpad/backups/`。

## 文档与开发

- [在线文档](https://awesomedog.github.io/maxlaunchpad/)
- [FAQ](../faq/index.md)
- [用户指南](../guide/index.md)
- [技术架构](../tech/technical-architecture.md)
- [国际化说明](../tech/i18n.md)

开发环境需要 Node.js `>=22.20.0`：

```shell
npm install
npm start       # 启动开发环境
npm test        # 运行测试
npm run lint    # 运行 ESLint
npm run make    # 构建安装包
```

项目结构、贡献流程和全部脚本请参阅英文版 README 的[开发指南](../../README.md#development-guide-for-contributors)。问题反馈和 Pull Request 都欢迎提交。

## 许可证与致谢

MaxLaunchpad 使用 MIT 许可证。它是已停止维护的 [MaxLauncher](https://maxlauncher.sourceforge.io/) 的精神续作，将键盘启动工作流扩展到了 Windows、macOS 和 Ubuntu/Linux。
