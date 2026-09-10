# MaxLaunchpad —— 키보드로 조작하는 크로스 플랫폼 앱 실행기

> 단축키로 가상 키보드를 불러오고, 키 하나만 눌러 앱을 실행하세요. 입력도, 검색도, 유사 일치 순위 운도 필요 없습니다.

[English](../../README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [日本語](README.ja.md) · [Русский](README.ru.md) · [Español](README.es.md) · **[한국어](README.ko.md) (현재 페이지)**

[![최신 릴리스](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![다운로드 수](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![플랫폼](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![라이선스](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="MaxLaunchpad 가상 키보드 앱 실행기 화면">
</p>

MaxLaunchpad는 Windows, macOS, Linux용 무료 오픈 소스 애플리케이션 실행기입니다. 애플리케이션을 가상 키보드의 키에 연결하고, 전역 단축키로 어떤 앱에서든 불러온 뒤 키 한 번만 눌러 원하는 프로그램을 실행합니다.

## 주요 기능

- **결정적 실행** — 같은 키는 검색 순서와 관계없이 항상 같은 앱을 실행합니다.
- **310개의 단축키** — 탭 10개에 각각 30개 키, 그리고 모든 탭이 공유하는 `F1`–`F10`.
- **전역 단축키** — 기본값은 Windows/Linux `Alt` + `` ` ``, macOS `Option` + `` ` ``이며 원하는 대로 바꿀 수 있습니다.
- **크로스 플랫폼 실행** — 실행 파일, 바로 가기, 스크립트, 앱 번들, `.desktop` 항목, URL은 물론 명령줄 인수와 작업 디렉터리까지 지원합니다.
- **드래그 앤 드롭 설정** — 탐색기, Finder, 파일 관리자에서 프로그램을 키로 끌어다 놓으면 됩니다.
- **여러 프로필** — `keyboard.yaml`, `work.yaml`, `gaming.yaml` 등 YAML 파일로 상황별로 관리하세요.
- **검색과 빠른 선택** — 편집 대화상자에서 설치된 앱을 검색하면 이름, 경로, 설명이 자동으로 채워집니다.
- **테마와 인터페이스** — 라이트 / 다크 / 시스템 테마, 사용자 지정 CSS, 간편 모드, 항상 위에 표시, 포커스를 잃으면 자동 숨김.
- **시스템 트레이** — 트레이로 최소화, 시작 시 실행, 창을 숨긴 상태로 시작하기.
- **무료 오픈 소스** — Electron, React, TypeScript 기반. 계정도, 클라우드도, 원격 측정도 없습니다.

## 설치

### 패키지 관리자

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### 직접 다운로드

[릴리스 페이지](https://github.com/AwesomeDog/maxlaunchpad/releases)에서 사용 중인 운영체제의 설치 프로그램을 받으세요.

| 플랫폼 | 요구 사항 | 참고 |
| --- | --- | --- |
| Windows | Windows 10 이상 | 설치 후 바로 사용할 수 있습니다. |
| macOS | macOS 11 Big Sur 이상, Apple Silicon | 실행이 차단되면 `xattr -cr /Applications/MaxLaunchpad.app` 명령으로 격리 플래그를 지우세요. |
| Linux | Ubuntu 24.04 또는 호환 배포판 | Wayland에서는 GNOME 키보드 설정에서 전역 단축키를 직접 지정해야 할 수 있습니다. |

## 60초 빠른 시작

1. **MaxLaunchpad를 실행합니다.** 가상 키보드가 나타나고 시스템 트레이에도 상주합니다.
2. **`View > Drag & Drop Mode`를 켜서** 설정하는 동안 창이 계속 보이게 합니다.
3. **앱을 키로 끌어다 놓으세요**(탐색기 / Finder / 파일). 또는 키를 마우스 오른쪽 버튼으로 클릭 → **Edit**에서 **Quick Select**로 설치된 앱을 검색합니다.
4. **탭 이름을 지정하세요**(숫자 키 `1`–`0`을 오른쪽 클릭 → Edit). 예: `Dev`, `Work`, `Games`.
5. **드래그 앤 드롭 모드를 끄고**, 아무 앱에서나 `Alt` + `` ` ``를 누른 다음 원하는 키를 누르면 됩니다.

모든 사용자 데이터는 기본적으로 다음 위치에 저장됩니다.

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # 앱 설정과 전역 단축키
├── keyboard.yaml     # 기본 키보드 프로필
├── caches/           # 아이콘 캐시
├── logs/             # 애플리케이션 로그
├── styles/           # 사용자 지정 CSS 테마
└── backups/          # 자동 백업
```

`XDG_CONFIG_HOME`이 설정되어 있으면 이 경로도 함께 조정됩니다. 이 폴더를 Git, Dropbox, Syncthing에 넣어 두면 여러 기기에서 실행기 설정을 동기화할 수 있습니다.

## 키보드 배치와 단축키

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   모든 탭이 공유하는 단축키
1  2  3  4  5  6  7  8  9  0     탭 전환
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     탭마다 30개의 앱 키
Z  X  C  V  B  N  M  ,  .  /
```

| 단축키 | 동작 |
| --- | --- |
| `Alt` + `` ` ``(macOS는 `Option` + `` ` ``) | MaxLaunchpad 표시 / 숨기기 |
| `F1`–`F10` | 전역 단축키 실행 |
| `Q`–`P`, `A`–`;`, `Z`–`/` | 활성 탭의 앱 실행 |
| `1`–`0` | 해당 탭으로 이동 |
| `←` / `→` | 이전 / 다음 탭 |
| `Ctrl+F` / `Cmd+F` | 모든 단축키 검색 |
| `Esc` | 대화상자 닫기 또는 창 숨기기 |
| 키를 왼쪽 클릭 | 프로그램 실행 |
| 키를 오른쪽 클릭 | 컨텍스트 메뉴(편집 / 복사 / 잘라내기 / 붙여넣기 / 삭제 / 파일 위치 열기) |
| 키에 파일 드롭 | 해당 키 설정 |

## YAML 설정 예시

```yaml
tabs:
  - id: '1'
    label: '개발'
  - id: '2'
    label: '작업'

keys:
  - tabId: '1'
    id: Q
    label: 터미널
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

각 단축키에는 `arguments`, `workingDirectory`, `runAsAdmin`, `description`과 사용자 지정 아이콘도 지정할 수 있습니다. 전체 예시는 [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml)을 참고하세요.

## 자주 묻는 질문

**MaxLaunchpad는 무료인가요?**  네. MIT 라이선스의 무료 오픈 소스 프로젝트입니다.

**Windows 11과 Apple Silicon을 지원하나요?**  네. Windows 11은 Windows 10 이상에 포함되고, macOS 설치 프로그램은 Apple Silicon용입니다.

**Linux / Wayland에서 전역 단축키가 작동하나요?**  네. 다만 일부 데스크톱 환경에서는 시스템 키보드 설정에서 직접 단축키를 지정해야 합니다.

**Microsoft Store 앱, `.lnk` 바로 가기, 스크립트를 실행할 수 있나요?**  네. Windows는 `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, UWP, `shell:`, macOS는 `.app`, Unix 실행 파일, `.sh`, `.command`, Linux는 ELF, `.desktop`, `.sh`, `.py`, `.rb`를 지원합니다.

**로그와 백업은 어디에 있나요?**  `~/.config/MaxLaunchpad/logs/`와 `~/.config/MaxLaunchpad/backups/`입니다.

## 문서와 개발

- [온라인 설명서](https://awesomedog.github.io/maxlaunchpad/)
- [FAQ](../faq/index.md)
- [사용자 가이드](../guide/index.md)
- [기술 아키텍처](../tech/technical-architecture.md)
- [국제화 안내](../tech/i18n.md)

개발 환경에는 Node.js `>=22.20.0`이 필요합니다.

```shell
npm install
npm start       # 개발 모드로 실행
npm test        # 테스트 실행
npm run lint    # ESLint 실행
npm run make    # 설치 프로그램 빌드
```

프로젝트 구조, 기여 절차, 모든 스크립트는 영어 README의 [개발 가이드](../../README.md#development-guide-for-contributors)를 참고하세요. 이슈와 Pull Request를 환영합니다.

## 라이선스와 크레딧

MaxLaunchpad는 MIT 라이선스로 배포됩니다. 개발이 중단된 [MaxLauncher](https://maxlauncher.sourceforge.io/)의 정신적 후속작이며, 그 키보드 실행 방식을 Windows에서 macOS와 Ubuntu/Linux로 확장한 프로젝트입니다.
