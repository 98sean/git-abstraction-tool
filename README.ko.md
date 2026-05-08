# Git Abstraction Tool (VIVA)

[![English](https://img.shields.io/badge/lang-English-blue)](README.md)
[![한국어](https://img.shields.io/badge/lang-%ED%95%9C%EA%B5%AD%EC%96%B4-green)](README.ko.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)]()

**터미널이 익숙하지 않은 모든 사람을 위한 Git 버전 관리 도구.**

VIVA(Visual Interface for Version Assistance)는 코드를 안전하고 쉽게 저장·검토·공유할 수 있도록 만든 로컬 우선 데스크톱 앱입니다. UI에서 shell 명령어를 입력할 필요 없이, 파괴적이거나 되돌리기 어려운 작업은 반드시 명시적 동의를 거치는 Git 시각화 워크플로를 제공합니다. AI 도구는 필요한 순간에만 개입하는 선택형 기능으로 제공됩니다.

AI 도구로 코드를 생성하지만 이를 안정적으로 관리할 방법이 필요한 바이브 코더, 디자이너, 학생, 초기 개발자를 위해 만들었습니다.

---

## 기능

- **로컬 우선 저장** — GitHub나 AI 설정 없이도 프로젝트 변경 이력을 저장할 수 있습니다
- **안전한 프로젝트 연결** — 폴더를 연결하기 전에 생성 파일·민감 파일을 확인하고, `git init` 실행 전 사용자에게 묻습니다
- **전체 파일 가시성** — tracked, changed, staged, untracked, clean 파일을 한 패널에서 함께 보여줍니다
- **Dependency 숨김** — 생성 폴더를 기본으로 숨기고, 필요할 때 **Show deps**로 확인합니다
- **브랜치 기반 워크플로** — 브랜치 생성·전환·병합·삭제를 지원하며 default branch와 current branch에는 안전장치를 둡니다
- **선택형 AI 도구** — AI provider 키를 한 번 연결하면 저장 메시지 제안과 수동 AI 도구를 사용할 수 있습니다
- **언어와 용어 모드 분리** — English/한국어를 독립적으로 전환하고, 초보자 친화 용어와 Git 친화 용어를 별도로 선택합니다
- **명시적 클라우드 업로드** — private backup repo 또는 팀 협업 대상을 직접 선택하기 전에는 아무것도 push하지 않습니다
- **업데이트 미리보기** — remote의 새 변경사항을 pull하기 전에 commit과 변경 파일을 먼저 확인합니다

UI에서 shell 명령어를 직접 입력할 필요는 없습니다.

---

## 스크린샷

> 스크린샷을 여기에 추가해 주세요.

---

## 설치

### Windows
1. [Releases page](../../releases)에서 `Git-Abstraction-Tool-Setup.exe`를 다운로드합니다
2. installer를 실행합니다
3. **Git Abstraction Tool**을 실행합니다

### macOS
1. [Releases page](../../releases)에서 `Git-Abstraction-Tool.dmg`를 다운로드합니다
2. 앱을 Applications 폴더로 드래그합니다
3. Applications에서 앱을 실행합니다

### Linux
1. [Releases page](../../releases)에서 `Git-Abstraction-Tool.AppImage`를 다운로드합니다
2. 실행 권한을 부여합니다: `chmod +x Git-Abstraction-Tool.AppImage`
3. 앱을 실행합니다: `./Git-Abstraction-Tool.AppImage`

> **필수 조건:** 컴퓨터에 Git이 설치되어 있어야 합니다.
> - Windows: [git-scm.com](https://git-scm.com/download/win)
> - macOS: `xcode-select --install`로 Xcode Command Line Tools 설치
> - Linux: package manager로 `git` 설치
>
> Git이 감지되지 않으면 앱이 setup guide를 보여주고, 설치 후 다시 확인할 수 있게 합니다.

---

## 시작하기

### 1. 프로젝트 연결

sidebar에서 **+ Link a Project**를 클릭합니다.

연결 wizard는 다음을 수행합니다.

- 폴더를 선택합니다
- Git이 이미 설정되어 있는지 확인합니다
- 로컬 이력을 켜기 위해 `git init`이 필요한 경우 먼저 묻습니다
- generated, binary, sensitive, large file 경고를 보여줍니다
- 첫 저장 전에 `.DS_Store`, `node_modules`, build output 같은 항목을 제외하도록 추천합니다

준비가 성공해야 폴더가 앱에 등록됩니다.

연결된 프로젝트가 나중에 **Not a Git repository** 상태가 되더라도 앱은 조용히 `git init`을 실행하지 않습니다. 사용자가 직접 복구 액션을 선택해야 합니다.

### 2. 파일 검토와 저장

main panel은 tracked file과 현재 변경사항을 함께 보여줍니다.

**Show deps** / **Hide deps**로 `node_modules`, build output 같은 dependency/generated 폴더를 펼치거나 숨길 수 있습니다.

저장할 파일을 stage하고, 메시지를 작성한 뒤 **Save Progress**를 클릭합니다.

**AI Suggest**를 누르면 staged diff를 기준으로 commit message 초안을 만들 수 있습니다. AI provider가 연결되어 있지 않거나 staged diff가 없으면, 앱은 숨겨진 key나 환경변수를 쓰지 않고 명확한 오류를 보여줍니다.

프로젝트에서 AI save message가 켜져 있으면 다음 흐름으로 동작합니다.

1. 첫 번째 save action이 staged diff로 메시지 초안을 만듭니다
2. 사용자가 메시지를 검토하거나 수정합니다
3. 다음 save action이 실제 commit을 만듭니다

수동 AI 도구는 저장 흐름과 분리되어 있습니다.

- **Natural Language Undo** — 자연어로 되돌리고 싶은 시점을 찾아줍니다
- **File Insight** — 선택한 파일과 주변 맥락을 설명합니다
- **Untracked Review** — stage하거나 삭제하기 전에 untracked file을 검토합니다
- **Weekly Report** — 최근 작업을 요약하며, AI가 없을 때도 Git 데이터 기반 fallback을 제공합니다

### 3. 브랜치 관리

project header의 branch pill에서 다음을 할 수 있습니다.

- 기존 local branch로 전환
- 업로드 전 새 branch 생성
- 선택한 branch를 현재 branch로 merge
- 안전한 경우 branch 삭제

앱은 default branch 삭제를 막고, current branch 삭제 전 fallback branch를 요구합니다. 보호 성격의 default branch로 merge하는 작업은 위험 작업으로 보고 명시적 확인을 요구합니다.

### 4. GitHub 업로드

**Upload to Cloud**를 클릭합니다.

처음 사용할 때 앱은 setup wizard를 엽니다.

- **Back up to my GitHub** — app-managed private backup repository를 만듭니다
- **Upload work to a team repository** — 협업할 remote와 branch mode를 직접 선택합니다

이 중 하나를 명시적으로 설정하기 전에는 업로드가 발생하지 않습니다.

팀 업로드에서는 `gat/my-update` 같은 새 작업 branch를 사용하는 흐름을 권장합니다. 이 branch가 GitHub로 push되고, GitHub가 compare URL을 제공할 수 있으면 앱은 **Open pull request** handoff link를 보여줍니다. 변경사항은 팀이 review하고 merge하기 전까지 `main`에 들어가지 않습니다.

### 5. remote 업데이트 가져오기

연결된 remote에 새 commit이 있으면 **Get Updates**를 사용합니다.

앱은 pull 전에 incoming commit과 changed file을 미리 보여줍니다. Git conflict가 발생하면 앱이 conflict를 알려주며, 자동으로 해결하려고 하지 않습니다.

---

## GitHub Token

GitHub upload 기능을 쓰려면 sidebar footer에서 GitHub를 연결합니다.

사용 가능한 방식은 다음과 같습니다.

- 앱 안의 **GitHub device login**
- **Personal Access Token**

classic token 기준:

- private repository workflow에는 넓은 권한의 `repo` scope가 필요합니다
- public repository만 사용할 경우 `public_repo`로 충분합니다

앱은 classic `ghp_...` token과 fine-grained `github_pat_...` token을 모두 받을 수 있습니다.

GitHub credential은 plain text가 아니라 Electron `safeStorage`로 저장됩니다.

---

## 기능 안내

### Project Linking

**+ Link a Project**로 폴더를 앱에 등록합니다.

앱은 폴더에 Git history가 있는지, remote가 있는지, history에 넣기 위험하거나 시끄러운 파일이 있는지 확인합니다. 추천 exclude가 먼저 표시되므로 generated folder, local OS file, secret, large binary가 첫 저장에 들어가는 일을 줄일 수 있습니다.

폴더가 Git repository가 아니면 앱은 `git init` 실행 전 사용자에게 묻습니다. 연결된 프로젝트가 나중에 `.git` metadata를 잃어도 복구는 명시적인 사용자 선택으로만 진행됩니다.

### File Review

project file panel은 변경된 파일만이 아니라 전체 프로젝트 상태를 보여주도록 설계되어 있습니다.

- **Tracked clean file** — 이미 history에 들어간 파일을 알 수 있게 보여줍니다
- **Modified, staged, untracked file** — 상태가 표시됩니다
- **Dependency/generated folder** — 기본적으로 숨겨 검토 집중도를 높입니다
- **Show deps** — dependency/generated folder를 명시적으로 확인할 때 사용합니다
- **Hide deps** — 확인 후 다시 접을 때 사용합니다

### Save Progress

**Save Progress**는 local commit을 만드는 기능입니다.

일반 흐름은 다음과 같습니다.

1. 변경 파일을 검토합니다
2. 저장에 포함할 파일을 stage합니다
3. 메시지를 직접 쓰거나 AI로 생성합니다
4. local commit을 저장합니다

local history 저장에는 GitHub나 AI가 필요하지 않습니다.

### Branch Management

project header의 branch control로 local branch를 생성, 전환, merge, 삭제할 수 있습니다.

branch name은 사용 전에 검증됩니다. 앱은 default branch 삭제를 막고, current branch 삭제 전 fallback branch를 요구하며, 위험한 default-branch 작업에는 명시적 확인을 요구합니다.

### GitHub Upload

local change를 저장한 뒤 **Upload to Cloud**를 사용합니다.

- **Back up to my GitHub** — app-managed private backup repository를 만들고 `gat-backup` remote를 사용합니다
- **Upload work to a team repository** — 사용자가 명시적으로 선택한 collaboration remote와 branch mode를 사용합니다
- **New branch upload** — GitHub pull request review로 이어지므로 권장되는 팀 작업 흐름입니다
- **Default branch upload** — 위험 작업으로 처리되며 명시적 확인을 요구합니다

앱은 upload 대상으로 `origin`을 자동 재사용하지 않습니다. cloud target을 먼저 선택해야 합니다.

### Get Updates

**Get Updates**는 선택된 collaboration branch에서 pull하기 전에 incoming remote commit을 확인하는 기능입니다.

Git이 clean하게 보고할 수 있는 경우 commit과 changed file preview를 보여줍니다. pull이 conflict를 만들 수 있으면 앱은 자동 해결 대신 conflict를 보고합니다.

### Project Settings

각 linked project에는 통합 **Project Settings** panel이 있습니다.

Project Settings에서 확인할 수 있는 것:

- AI save-message 상태
- AI diff-consent 상태
- 선택된 AI model
- cloud setup 상태
- **Connect AI** 진입점

Project Settings는 raw GitHub token이나 AI API key를 직접 수집하지 않습니다. credential은 전용 연결 흐름에서 처리됩니다.

### 언어와 용어 모드

sidebar에는 **English**와 **한국어**를 전환하는 language selector가 있습니다.

언어 선택은 terminology mode와 분리되어 있습니다.

- **Newbie mode** — **Save Progress**, **Version**, **Upload**처럼 쉬운 제품 언어를 사용합니다
- **Pro mode** — **Commit**, **Branch**, **Push**처럼 Git을 아는 사용자에게 익숙한 용어를 사용합니다

AI가 생성하는 save message, Natural Language Undo 설명, File Insight, Untracked Review reason, Weekly Report summary는 선택된 앱 언어로 출력되도록 요청합니다.

---

## AI Provider

현재 앱은 다음 AI provider를 지원합니다.

- OpenAI
- Anthropic

AI key도 Electron `safeStorage`로 저장됩니다.

staged diff는 프로젝트가 명시적으로 AI diff consent를 허용한 뒤에만 전송됩니다.

`Connect AI`가 유일하게 지원되는 AI credential 입력 경로입니다. Project Settings는 이 흐름을 열고 project-level AI 설정을 관리할 수 있지만, raw API key를 직접 수집하거나 저장하지 않습니다.

### AI Suggest

save-message 영역 근처의 **AI Suggest**를 사용합니다.

하는 일:

- staged diff를 읽습니다
- commit message 초안을 만듭니다
- 저장 전 사용자가 메시지를 수정할 수 있게 둡니다

필요 조건:

- AI provider가 연결되어 있어야 합니다
- 프로젝트가 diff consent를 허용해야 합니다
- 최소 하나 이상의 file이 staged 상태여야 합니다

### Auto Save Message

켜져 있을 때:

1. 첫 번째 save action이 staged diff에서 메시지 초안을 만듭니다
2. 사용자가 메시지를 검토하거나 수정합니다
3. 다음 save action이 commit을 만듭니다

### Natural Language Undo

입력 예시:

- `go back to before I changed the upload flow`
- `undo the last UI cleanup`
- `restore the version before the AI settings change`

이 도구는 project history를 검색해 가능성이 높은 restore point와 file preview를 제안합니다. restore는 사용자가 명시적으로 apply action을 선택했을 때만 적용됩니다.

### File Insight

선택한 file이 어떤 역할을 하는지 설명하고, 관련 변경사항과 주변 맥락을 요약합니다. 해당 파일을 review, stage, 또는 보류할지 판단하는 데 도움을 줍니다.

### Untracked Review

untracked file이 history에 들어가기 전에 검토하고, generated file·local machine file·민감해 보이는 file을 알려줍니다. source file과 `.gitignore`에 들어갈 file을 구분하는 데 도움을 줍니다. 조언만 제공하며, 실제 결정은 사용자가 합니다.

### Weekly Report

AI가 연결되어 있으면 최근 history를 바탕으로 feature-focused summary를 만듭니다. AI가 없어도 Git data 기반 deterministic local summary를 제공합니다.

---

## 안전 규칙

- 조용한 `git init` 없음
- upload 대상으로 `origin` 자동 재사용 없음
- cloud target 설정 전 upload 없음
- 위험 확인 없는 default-branch 직접 upload 없음
- default branch 삭제 없음
- force-push workflow 없음
- project-level consent 없는 AI diff 전송 없음
- Project Settings 내부에서 AI key 직접 수집 없음
- pull 또는 merge conflict 자동 해결 없음

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 데스크톱 셸 | [Electron](https://www.electronjs.org/) |
| UI | [React](https://react.dev/) + TypeScript |
| Git 작업 | [simple-git](https://github.com/steveukx/git-js) |
| 로컬 저장소 | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) |
| AI provider | OpenAI API, Anthropic API |
| 다국어 | 자체 i18n 레이어 (English + 한국어) |
| 테스트 | [Vitest](https://vitest.dev/) + Testing Library |
| 패키징 | [electron-builder](https://www.electron.build/) |

---

## 개발

```bash
npm install
npm run dev       # 개발 모드로 앱 실행
npm test          # Vitest로 테스트 실행
npm run typecheck # TypeScript 타입 검사
```

메인 프로세스 코드는 `src/main/`, React UI는 `src/renderer/src/`, 공유 타입은 `src/shared/`에 있습니다.

---

## 기여

기여를 환영합니다. 특히 안전 규칙이나 AI provider 경계에 영향을 미치는 변경사항은 먼저 issue를 열어 논의해 주세요.

1. 저장소를 fork하고 `main`에서 branch를 만듭니다
2. 해당하는 경우 테스트와 함께 변경사항을 작성합니다
3. PR을 제출하기 전에 `npm test`와 `npm run typecheck`를 실행합니다
4. 변경 내용과 이유를 명확하게 설명한 pull request를 엽니다

PR은 하나의 목적에 집중해 주세요. 그래야 review가 빠릅니다.

---

## 현재 제한사항

- Backup repository는 현재 app-managed private GitHub repository로 생성됩니다; public/private 선택은 현재 release에 포함되지 않습니다
- pull과 merge conflict는 보고만 하며 자동 해결하지 않습니다
- 팀 협업 upload는 branch-first 흐름이며, pull request 생성은 GitHub compare URL로 handoff합니다
- AI tools는 connected provider와 project consent가 있어야 diff를 전송합니다

---

## 라이선스

[MIT](LICENSE)

---

## 한국어 Git 기능 가이드

앱 UI와 실제 Git 동작을 연결해서 설명하는 한국어 guide:

- [docs/git-feature-guide-ko.md](docs/git-feature-guide-ko.md)
