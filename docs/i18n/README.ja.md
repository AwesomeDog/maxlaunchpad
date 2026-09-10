# MaxLaunchpad —— キーボード駆動のクロスプラットフォームアプリランチャー

> ホットキーで仮想キーボードを呼び出し、あとは 1 キー押すだけでアプリを起動。入力も検索も、あいまい検索の順位待ちも不要です。

[English](../../README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **[日本語](README.ja.md)（このページ）** · [Русский](README.ru.md) · [Español](README.es.md) · [한국어](README.ko.md)

[![最新リリース](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![ダウンロード数](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![対応プラットフォーム](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![ライセンス](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="MaxLaunchpad の仮想キーボード型アプリランチャー画面">
</p>

MaxLaunchpad は Windows、macOS、Linux 向けの無料・オープンソースのアプリケーションランチャーです。アプリを仮想キーボードのキーに割り当て、どのアプリケーションからでもグローバルホットキーで呼び出し、もう 1 キー押すだけで目的のプログラムを起動できます。

## 機能一覧

- **確実な起動** — 同じキーは常に同じアプリを起動し、検索順位に左右されません。
- **310 個のショートカット** — 10 個のタブ × 30 キー、さらに全タブ共通の `F1`–`F10`。
- **グローバルホットキー** — 既定では Windows/Linux は `Alt` + `` ` ``、macOS は `Option` + `` ` ``。変更も可能です。
- **クロスプラットフォーム起動** — 実行ファイル、ショートカット、スクリプト、アプリバンドル、`.desktop` エントリ、URL に加え、引数と作業ディレクトリにも対応。
- **ドラッグ＆ドロップ設定** — Explorer、Finder、ファイルマネージャーからプログラムをキーにドラッグするだけです。
- **複数のプロファイル** — `keyboard.yaml`、`work.yaml`、`gaming.yaml` などの YAML ファイルでシーンごとに管理できます。
- **検索とクイック選択** — 編集ダイアログでインストール済みアプリを検索し、名前・パス・説明を自動入力します。
- **テーマとインターフェース** — ライト / ダーク / システム連動テーマ、カスタム CSS、コンパクトモード、常に最前面表示、フォーカス喪失時の自動非表示。
- **システムトレイ** — トレイへの最小化、ログイン時の自動起動、起動時にウィンドウを隠す設定に対応。
- **無料・オープンソース** — Electron、React、TypeScript 製。アカウント不要、クラウド不要、テレメトリーなし。

## インストール

### パッケージマネージャー

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### 直接ダウンロード

[リリースページ](https://github.com/AwesomeDog/maxlaunchpad/releases) から、お使いの OS 向けのインストーラーを入手してください。

| プラットフォーム | 要件 | 備考 |
| --- | --- | --- |
| Windows | Windows 10 以降 | インストール後すぐに使用できます。 |
| macOS | macOS 11 Big Sur 以降（Apple Silicon） | 起動がブロックされる場合は `xattr -cr /Applications/MaxLaunchpad.app` を実行して隔離属性を解除してください。 |
| Linux | Ubuntu 24.04 または同等のディストリビューション | Wayland では GNOME のキーボード設定でグローバルホットキーを手動設定する必要がある場合があります。 |

## 60 秒クイックスタート

1. **MaxLaunchpad を起動します。** 仮想キーボードが表示され、システムトレイにも常驻します。
2. **`View > Drag & Drop Mode` を有効にして**、設定中もウィンドウを表示させます。
3. **アプリをキーにドラッグ**します（Explorer / Finder / ファイル）。またはキーを右クリック → **Edit** から **Quick Select** でインストール済みアプリを検索します。
4. **タブに名前を付けます**（数字キー `1`–`0` を右クリック → Edit）。例: `Dev`、`Work`、`Games`。
5. **ドラッグ＆ドロップモードを無効にし**、任意のアプリから `Alt` + `` ` `` を押してから目的のキーを押します。完了です。

すべてのユーザーデータは既定で以下に保存されます。

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # アプリ設定とグローバルホットキー
├── keyboard.yaml     # 既定のキーボードプロファイル
├── caches/           # アイコンキャッシュ
├── logs/             # アプリケーションログ
├── styles/           # カスタム CSS テーマ
└── backups/          # 自動バックアップ
```

`XDG_CONFIG_HOME` が設定されている場合は、それに応じてパスが変わります。このフォルダーを Git、Dropbox、Syncthing に置けば、複数のマシンでランチャー設定を同期できます。

## キーボードレイアウトとショートカット

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   全タブ共通のショートカット
1  2  3  4  5  6  7  8  9  0     タブの切り替え
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     タブごとに 30 個のアプリキー
Z  X  C  V  B  N  M  ,  .  /
```

| 操作 | 動作 |
| --- | --- |
| `Alt` + `` ` ``（macOS は `Option` + `` ` ``） | MaxLaunchpad の表示 / 非表示 |
| `F1`–`F10` | グローバルショートカットを起動 |
| `Q`–`P`、`A`–`;`、`Z`–`/` | アクティブなタブのアプリを起動 |
| `1`–`0` | 対応するタブへ移動 |
| `←` / `→` | 前 / 次のタブ |
| `Ctrl+F` / `Cmd+F` | すべてのショートカットを検索 |
| `Esc` | ダイアログを閉じる、またはウィンドウを隠す |
| キーを左クリック | プログラムを起動 |
| キーを右クリック | コンテキストメニュー（編集 / コピー / 切り取り / 貼り付け / 削除 / ファイルの場所を開く） |
| キーにファイルをドロップ | そのキーを設定 |

## YAML 設定例

```yaml
tabs:
  - id: '1'
    label: '開発'
  - id: '2'
    label: '仕事'

keys:
  - tabId: '1'
    id: Q
    label: ターミナル
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

各ショートカットでは `arguments`、`workingDirectory`、`runAsAdmin`、`description`、カスタムアイコンなども指定できます。完全な例は [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml) を参照してください。

## よくある質問

**MaxLaunchpad は無料ですか？**  はい。MIT ライセンスの無料オープンソースソフトウェアです。

**Windows 11 や Apple Silicon に対応していますか？**  はい。Windows 11 は「Windows 10 以降」に含まれ、macOS 版は Apple Silicon 向けです。

**Linux / Wayland でグローバルホットキーは使えますか？**  使えますが、デスクトップ環境によってはシステムのキーボード設定で手動バインドが必要です。

**Microsoft Store アプリ、`.lnk` ショートカット、スクリプトを起動できますか？**  できます。Windows は `.exe`、`.lnk`、`.bat`、`.cmd`、`.ps1`、UWP、`shell:`、macOS は `.app`、Unix 実行ファイル、`.sh`、`.command`、Linux は ELF、`.desktop`、`.sh`、`.py`、`.rb` に対応しています。

**ログとバックアップはどこにありますか？**  `~/.config/MaxLaunchpad/logs/` と `~/.config/MaxLaunchpad/backups/` です。

## ドキュメントと開発

- [オンラインマニュアル](https://awesomedog.github.io/maxlaunchpad/)
- [FAQ](../faq/index.md)
- [ユーザーガイド](../guide/index.md)
- [技術アーキテクチャ](../tech/technical-architecture.md)
- [国際化について](../tech/i18n.md)

開発環境には Node.js `>=22.20.0` が必要です。

```shell
npm install
npm start       # 開発モードで起動
npm test        # テストを実行
npm run lint    # ESLint を実行
npm run make    # インストーラーをビルド
```

プロジェクト構成、コントリビューションの流れ、全スクリプトは英語版 README の[開発ガイド](../../README.md#development-guide-for-contributors)を参照してください。Issue や Pull Request を歓迎します。

## ライセンスと謝辞

MaxLaunchpad は MIT ライセンスで公開されています。開発が終了した [MaxLauncher](https://maxlauncher.sourceforge.io/) の精神的後継であり、そのキーボード起動のワークフローを Windows から macOS と Ubuntu/Linux へ拡張したものです。
