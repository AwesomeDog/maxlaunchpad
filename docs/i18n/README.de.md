# MaxLaunchpad — Tastaturgesteuerter, plattformübergreifender Anwendungsstarter

> Mit einer Tastenkombination ein virtuelles Tastenfeld aufrufen und mit einem weiteren Tastendruck die Anwendung starten. Kein Tippen, kein Suchen, keine Trefferlisten-Lotterie.

[English](../../README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · **[Deutsch](README.de.md) (diese Seite)** · [日本語](README.ja.md) · [Русский](README.ru.md) · [Español](README.es.md) · [한국어](README.ko.md)

[![Neueste Version](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Downloads](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Plattformen](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Lizenz](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="Oberfläche des virtuellen Tastatur-Starters MaxLaunchpad">
</p>

MaxLaunchpad ist ein kostenloser, quelloffener Anwendungsstarter für Windows, macOS und Linux. Es ordnet Anwendungen den Tasten eines virtuellen Tastenfelds zu, das sich aus jeder Anwendung heraus mit einem globalen Tastenkürzel aufrufen lässt — ein weiterer Tastendruck startet das gewünschte Programm.

## Funktionsübersicht

- **Deterministisches Starten** — dieselbe Taste startet immer dieselbe Anwendung, unabhängig von einer Suchreihenfolge.
- **310 Tastenkürzel** — 10 Registerkarten mit je 30 Tasten, zusätzlich die registerkartenübergreifend gemeinsamen Tasten `F1`–`F10`.
- **Globales Tastenkürzel** — standardmäßig `Alt` + `` ` `` unter Windows/Linux und `Option` + `` ` `` unter macOS, vollständig anpassbar.
- **Plattformübergreifendes Starten** — ausführbare Dateien, Verknüpfungen, Skripte, App-Pakete, `.desktop`-Einträge, URLs sowie Argumente und Arbeitsverzeichnis.
- **Konfiguration per Drag & Drop** — ziehen Sie ein Programm aus dem Explorer, Finder oder Dateimanager auf eine Taste.
- **Mehrere Profile** — verwalten Sie Ihre Arbeitsbereiche mit `keyboard.yaml`, `work.yaml`, `gaming.yaml` und weiteren YAML-Dateien.
- **Suche und Schnellauswahl** — suchen Sie im Bearbeitungsdialog nach installierten Anwendungen, um Name, Pfad und Beschreibung automatisch auszufüllen.
- **Designs und Oberfläche** — helle, dunkle und systemabhängige Designs, eigenes CSS, kompakter Modus, „Immer im Vordergrund“ und automatisches Ausblenden bei Fokusverlust.
- **Infobereich** — in den Infobereich minimieren, Autostart und versteckter Start möglich.
- **Kostenlos und quelloffen** — basierend auf Electron, React und TypeScript: kein Konto, keine Cloud, keine Telemetrie.

## Installation

### Paketmanager

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### Direkter Download

Laden Sie das Installationsprogramm für Ihr System von der [Releases-Seite](https://github.com/AwesomeDog/maxlaunchpad/releases) herunter.

| Plattform | Voraussetzung | Hinweise |
| --- | --- | --- |
| Windows | Windows 10 oder neuer | Funktioniert direkt nach der Installation. |
| macOS | macOS 11 Big Sur oder neuer (Apple Silicon) | Führen Sie `xattr -cr /Applications/MaxLaunchpad.app` aus, um die Quarantäne-Kennzeichnung zu entfernen. |
| Linux | Ubuntu 24.04 oder gleichwertig | Unter Wayland muss das globale Tastenkürzel eventuell in den GNOME-Tastatureinstellungen manuell eingerichtet werden. |

## Start in 60 Sekunden

1. **Starten Sie MaxLaunchpad.** Das virtuelle Tastenfeld erscheint; das Programm befindet sich außerdem im Infobereich.
2. **Aktivieren Sie `View > Drag & Drop Mode`**, damit das Fenster während der Konfiguration sichtbar bleibt.
3. **Ziehen Sie Anwendungen auf die Tasten** aus Explorer / Finder / Dateien — oder klicken Sie mit der rechten Maustaste auf eine Taste → **Edit** und nutzen Sie **Quick Select**, um installierte Anwendungen zu suchen.
4. **Benennen Sie Ihre Registerkarten** (rechte Maustaste auf eine Zifferntaste `1`–`0` → Edit), z. B. `Dev`, `Work`, `Games`.
5. **Deaktivieren Sie den Drag & Drop-Modus**, drücken Sie überall `Alt` + `` ` `` und dann die gewünschte Taste. Fertig.

Alle Benutzerdaten werden standardmäßig hier gespeichert:

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # App-Einstellungen und globales Tastenkürzel
├── keyboard.yaml     # Standard-Tastaturprofil
├── caches/           # Symbol-Cache
├── logs/             # Anwendungsprotokolle
├── styles/           # Eigene CSS-Designs
└── backups/          # Automatische Sicherungen
```

Wenn `XDG_CONFIG_HOME` gesetzt ist, werden diese Pfade entsprechend angepasst. Legen Sie den Ordner in Git, Dropbox oder Syncthing, um Ihre Konfiguration zwischen mehreren Rechnern zu synchronisieren.

## Tastaturlayout und Tastenkürzel

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   Über alle Registerkarten gemeinsame Kürzel
1  2  3  4  5  6  7  8  9  0     Zwischen Registerkarten wechseln
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     30 Anwendungs-Tasten pro Registerkarte
Z  X  C  V  B  N  M  ,  .  /
```

| Tastenkürzel | Aktion |
| --- | --- |
| `Alt` + `` ` `` (auf macOS `Option` + `` ` ``) | MaxLaunchpad anzeigen / ausblenden |
| `F1`–`F10` | Globales Kürzel starten |
| `Q`–`P`, `A`–`;`, `Z`–`/` | Anwendung der aktiven Registerkarte starten |
| `1`–`0` | Zur entsprechenden Registerkarte wechseln |
| `←` / `→` | Vorherige / nächste Registerkarte |
| `Strg+F` / `Cmd+F` | Alle Kürzel durchsuchen |
| `Esc` | Dialog schließen oder Fenster ausblenden |
| Linksklick auf eine Taste | Programm starten |
| Rechtsklick auf eine Taste | Kontextmenü (Bearbeiten / Kopieren / Ausschneiden / Einfügen / Löschen / Dateispeicherort öffnen) |
| Datei auf eine Taste ziehen | Diese Taste konfigurieren |

## YAML-Konfigurationsbeispiel

```yaml
tabs:
  - id: '1'
    label: 'Dev'
  - id: '2'
    label: 'Work'

keys:
  - tabId: '1'
    id: Q
    label: Terminal
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

Jedes Kürzel unterstützt außerdem die Felder `arguments`, `workingDirectory`, `runAsAdmin`, `description` und ein eigenes Symbol. Vollständiges Beispiel: [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml).

## Häufige Fragen

**Ist MaxLaunchpad kostenlos?**  Ja. Das Projekt steht unter der MIT-Lizenz und ist kostenlos sowie quelloffen.

**Werden Windows 11 und Apple Silicon unterstützt?**  Ja. Windows 11 fällt unter „Windows 10+“, und das macOS-Installationsprogramm ist für Apple Silicon ausgelegt.

**Funktioniert das globale Tastenkürzel unter Linux / Wayland?**  Ja, manche Desktop-Umgebungen erfordern jedoch, das Kürzel manuell in den System-Tastatureinstellungen zu binden.

**Kann es Microsoft-Store-Apps, `.lnk`-Verknüpfungen und Skripte starten?**  Ja. Windows: `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, UWP und `shell:`; macOS: `.app`, Unix-Programme, `.sh`, `.command`; Linux: ELF, `.desktop`, `.sh`, `.py` und `.rb`.

**Wo befinden sich Protokolle und Sicherungen?**  In `~/.config/MaxLaunchpad/logs/` und `~/.config/MaxLaunchpad/backups/`.

## Dokumentation und Entwicklung

- [Online-Handbuch](https://awesomedog.github.io/maxlaunchpad/)
- [FAQ](../faq/index.md)
- [Benutzerhandbuch](../guide/index.md)
- [Technische Architektur](../tech/technical-architecture.md)
- [Internationalisierung](../tech/i18n.md)

Für die Entwicklung wird Node.js `>=22.20.0` benötigt:

```shell
npm install
npm start       # Entwicklungsmodus starten
npm test        # Tests ausführen
npm run lint    # ESLint ausführen
npm run make    # Installationsprogramm erstellen
```

Projektstruktur, Beitragsprozess und alle Skripte finden Sie im [Entwicklungsleitfaden](../../README.md#development-guide-for-contributors) des englischen README. Fehlerberichte und Pull Requests sind willkommen.

## Lizenz und Danksagung

MaxLaunchpad steht unter der MIT-Lizenz. Es ist der geistige Nachfolger des nicht mehr weiterentwickelten [MaxLauncher](https://maxlauncher.sourceforge.io/) und erweitert dessen tastaturgesteuerten Arbeitsablauf von Windows auf macOS und Ubuntu/Linux.
