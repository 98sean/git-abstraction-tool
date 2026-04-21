# Git Abstraction Tool 기능과 Git 동작 설명

이 문서는 현재 앱의 주요 기능이 내부적으로 어떤 Git 동작과 연결되는지 한국어로 설명합니다.

## Save Progress

- 쉬운 설명:
  선택한 변경사항을 하나의 저장 지점으로 기록합니다.
- 내부 Git 과정:
  선택된 파일을 stage한 뒤, 입력한 메시지로 commit을 만듭니다.
- 예시 명령:

```bash
git add src/app.ts src/styles.css
git commit -m "로그인 화면 간격 조정"
```

## Connect AI

- 쉬운 설명:
  앱에서 AI 기능을 쓰기 위한 전역 연결입니다.
- 내부 동작:
  사용자가 넣은 OpenAI 또는 Anthropic API key를 안전하게 저장하고,
  앱 전체에서 하나의 provider/model 상태를 유지합니다.
- 참고:
  AI key를 넣는 공식 경로는 `Connect AI` 하나입니다.

## AI Save Draft

- 쉬운 설명:
  Save Progress를 누를 때 staged diff를 보고 저장 메시지 초안을 만들어 줍니다.
- 내부 동작:
  프로젝트별 AI auto save가 켜져 있고 diff consent가 승인된 경우에만 staged diff를 AI provider로 보냅니다.
  첫 클릭은 초안 생성, 두 번째 클릭은 실제 commit입니다.
- 참고:
  AI가 실패해도 수동 저장은 계속 가능합니다.

## Natural Language Undo

- 쉬운 설명:
  “어제 오후 상태로 돌리고 싶다”처럼 자연어로 복구 지점을 찾는 기능입니다.
- 내부 동작:
  현재 프로젝트의 commit timeline을 AI에 보내고, 가장 적절한 restore target commit을 추천받습니다.
  추천 후에는 사용자가 직접 복구를 승인해야 합니다.

## File Insight

- 쉬운 설명:
  선택한 파일이 무슨 역할을 하는지와 관련 파일을 설명해 줍니다.
- 내부 동작:
  현재 선택한 파일 내용 일부, 최근 commit 정보, 관련 후보 파일을 AI에 보내 요약을 받습니다.

## Untracked Review

- 쉬운 설명:
  아직 추적되지 않은 파일이 commit할 파일인지, 지워도 되는 파일인지 검토해 줍니다.
- 내부 동작:
  먼저 generated/cache 규칙으로 1차 분류하고,
  애매한 항목만 AI에게 보내 `commit` 또는 `delete` 추천을 받습니다.

## Upload to Cloud

- 쉬운 설명:
  로컬에 저장한 작업을 GitHub 쪽 target으로 올립니다.
- 내부 Git 과정:
  먼저 프로젝트의 cloud target을 확인합니다.
  `none`이면 setup wizard를 먼저 엽니다.
  `backup`이면 app-managed backup remote로 push합니다.
  `collaboration`이면 사용자가 고른 remote와 branch 정책으로 push합니다.
- 예시 명령:

```bash
git push gat-backup HEAD
git push -u origin gat/my-update
```

## Get Updates

- 쉬운 설명:
  팀 저장소에 올라온 새 변경을 현재 협업 브랜치로 가져옵니다.
- 내부 Git 과정:
  collaboration target에 저장된 remote와 branch를 기준으로 pull합니다.
- 예시 명령:

```bash
git pull origin gat/my-update
```

## Turn on change history

- 쉬운 설명:
  아직 Git이 없는 폴더에서 버전 기록을 시작합니다.
- 내부 Git 과정:
  링크 wizard가 사용자 승인 후 `git init`을 실행합니다.
  선택한 recommended exclude 항목은 `.gitignore`에 추가합니다.
- 예시 명령:

```bash
git init
printf ".env\nnode_modules\n" >> .gitignore
```

## Backup vs Collaboration

- 쉬운 설명:
  backup은 내 계정의 private 저장소로 안전하게 보관하는 흐름이고,
  collaboration은 팀 저장소에 올리는 흐름입니다.
- 내부 Git 과정:
  backup은 `gat-backup` remote를 사용합니다.
  collaboration은 사용자가 명시적으로 고른 remote와 branch mode를 저장해서 사용합니다.

## Dangerous Default Branch Upload

- 쉬운 설명:
  팀의 기본 브랜치로 바로 올리는 것은 위험한 작업으로 취급합니다.
- 내부 동작:
  setup에서 이 모드를 고르더라도, 실제 업로드 시점에 한 번 더 확인 dialog를 거칩니다.

## Project Settings

- 쉬운 설명:
  한 프로젝트 안에서 AI와 Cloud 상태를 같이 보는 패널입니다.
- 보여주는 내용:
  - AI auto save on/off
  - AI diff consent 상태
  - 현재 AI 모델
  - cloud target 상태
  - backup 또는 collaboration 요약
- 참고:
  `Project Settings`는 auto save message 설정용입니다.
  `Natural Language Undo`, `File Insight`, `Untracked Review`는 여기서 켜고 끄는 방식이 아니라,
  작업 화면에서 필요할 때 직접 호출하는 도구입니다.

## 전역 연결 vs 프로젝트별 설정

- 전역:
  - `Connect GitHub`
  - `Connect AI`
- 프로젝트별:
  - AI save message 사용 여부
  - AI diff consent 여부
  - cloud target 종류와 branch 정책

즉, GitHub 토큰과 AI API key는 앱 전체에서 한 번 연결하고,
실제 사용 여부는 프로젝트마다 따로 관리합니다.
