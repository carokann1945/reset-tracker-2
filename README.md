## About Carokann

탭 단위로 루틴과 반복 작업을 분류하고, 주기마다 자동으로 초기화되는 개인용 작업 리셋 트래커입니다.

반복되는 일을 단순 체크리스트로 끝내지 않고, 주기와 시간 기준까지 포함해 다시 시작할 수 있게 만든 작업 관리 앱입니다.

## 배포 링크 / 깃허브 링크

- 배포 링크: https://carokann.app
- GitHub: https://github.com/carokann1945/carokann

## 대표 이미지

<p align="center">
  <img src="./public/preview/desktop1.png" alt="Carokann 메인 화면 데스크톱 1" width="49%" />
  <img src="./public/preview/desktop2.png" alt="Carokann 메인 화면 데스크톱 2" width="49%" />
</p>

## 주요 기능

- 탭 기반 작업 분류
  운동, 공부, 생활, 게임 루틴처럼 성격이 다른 작업을 탭으로 나눠 관리할 수 있습니다.
- 일반 작업 / 반복 작업 분리
  한 번 끝내는 작업과 주기적으로 다시 해야 하는 작업을 다른 모델로 관리합니다.
- 반복 작업 주기 설정
  매일, 매주, 매월, 매년, N일마다 형태로 반복 주기를 지정할 수 있습니다.
- 다중 체크 지원
  반복 작업마다 한 사이클에서 몇 번 체크해야 하는지 목표 횟수를 둘 수 있습니다.
- 시간 기준 초기화
  `plain` 기준과 브라우저 타임존 기준을 나눠서 반복 작업 초기화 시점을 설정할 수 있습니다.
- 자동 리셋
  반복 작업은 현재 사이클을 계산해 체크 상태와 완료 시점을 자동으로 초기화합니다.
- 작업 순서 변경
  `dnd-kit` 기반 드래그 앤 드롭으로 작업 순서를 바꿀 수 있습니다.
- 수정 / 삭제 / 복구
  작업과 탭 모두 수정할 수 있고, 삭제 후 짧은 시간 안에 복구할 수 있습니다.
- 모바일 대응 반응형 웹
  화면 크기에 따라 사이드바를 접고 열 수 있게 구성했으며 전체적으로 모바일에서 사용할 수 있게 UI를 최적화했습니다.

## 기술 스택

- 프레임워크: Next.js 16, React 19
- 언어: TypeScript
- 스타일링: Tailwind CSS 4
- UI 프리미티브: Radix UI, shadcn/ui
- 상태 관리: Zustand
- 드래그 앤 드롭: dnd-kit
- 날짜 / 시간 처리: `@js-temporal/polyfill`
- 알림 UI: Sonner
- 테스트: Vitest

## 기술 선택 이유

- Next.js 16
  App Router 기반으로 프로젝트 구조를 정리하기 쉽고, 개발 서버와 빌드 흐름을 단순하게 가져갈 수 있으며, 실서비스 예정이므로 SEO 최적화가 필요했습니다.
- Zustand
  탭, 작업, 사이드바 상태를 가볍게 분리할 수 있고, `localStorage` hydrate/save 흐름을 붙이기에도 부담이 적었습니다.
- Temporal polyfill
  월말, 윤년, 시간대 같은 날짜 계산의 까다로운 경계를 직접 다뤄야 해서 `Date`보다 안전한 계산 모델이 필요했습니다.
- dnd-kit
  단순한 정렬 기능만 필요한 상황에서 접근성과 확장성을 함께 가져가기 좋았습니다.
- Radix UI / shadcn/ui / Tailwind CSS
  기본 접근성을 갖춘 프리미티브 위에서 빠르게 UI를 조정할 수 있었고, 커스텀 디자인을 입히기에도 좋았습니다.
- Vitest
  `repeatTask.ts`, `taskStore.ts`, `tabStore.ts` 같은 순수 로직을 빠르게 검증하기 좋았습니다.

## 아키텍처, 폴더 구조

```text
src
├─ app
│  ├─ (tracker)
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ globals.css
│  └─ layout.tsx
├─ features
│  └─ tracker
│     ├─ components
│     │  ├─ sidebar
│     │  └─ task
│     ├─ hooks
│     └─ model
└─ lib
   └─ utils.ts
```

- `app/(tracker)`
  실제 트래커 화면 진입점입니다. 라우팅과 전역 레이아웃을 담당합니다.
- `features/tracker/components`
  `Header`, `Sidebar`, `TaskList`, `TaskItem`, `TaskDialog`처럼 화면을 구성하는 UI를 모아두었습니다.
- `features/tracker/hooks`
  삭제 후 복구, 반응형 사이드바 같은 UI 동작을 커스텀 훅으로 분리했습니다.
- `features/tracker/model`
  타입, 스토어, 저장소 입출력, 반복 작업 계산 로직, Provider를 모아둔 도메인 레이어입니다.
- `TabProvider`, `TaskProvider`
  초기 hydrate와 상태 저장을 담당합니다. `TaskProvider`는 주기 동기화를 위해 가시성 변경과 주기적 sync도 처리합니다.
- `repeatTask.ts`
  현재 사이클 계산, 다음 초기화 시점 계산, 반복 작업 동기화를 컴포넌트 밖 순수 함수로 분리해 테스트 가능성을 높였습니다.

## 트러블슈팅 / 성능 개선

- 월말 / 윤년 / 시간대 경계 계산
  반복 작업은 단순히 날짜를 더하는 수준으로 끝나지 않았습니다. 월말과 윤년, 시간대 차이에서 주기 계산이 어긋날 수 있어 `Temporal` 기반으로 현재 사이클과 다음 리셋 시점을 분리 계산했습니다.
- 삭제 후 복구 시 순서 보존
  작업이나 탭을 복구할 때 기존 `position`이 깨지지 않도록, 복구 시점에 다른 아이템의 위치를 다시 밀어 넣는 방식으로 정렬 문제를 해결했습니다.
- 탭 삭제 후 stale activeTab 처리
  활성 탭이 삭제된 뒤에도 이전 ID를 참조하는 문제가 생길 수 있어, 탭 상태 normalize와 선택자에서 유효한 활성 탭만 반환하도록 보완했습니다.
- 드래그 중 요소 찌그러짐 수정
  정렬 중 카드가 찌그러지는 문제를 줄이기 위해 드래그 핸들을 분리하고, 드래그 상태 전용 스타일을 따로 적용했습니다.
- 반복 작업 상태 동기화
  `TaskProvider`에서 5초 간격 sync와 `visibilitychange` 복귀 시 sync를 함께 사용해, 화면을 오래 켜두거나 다른 탭을 오간 뒤에도 반복 작업 상태가 늦게 갱신되지 않도록 했습니다.
- UX 개선
  사이드바 열고 닫기, 탭 리스트 UI, 작업 리스트 UI 등 최고의 UX를 위해 수많은 자료를 찾아가며 연구했습니다.

## 실행 방법

```bash
pnpm install
pnpm dev
pnpm build
pnpm vitest run
```

- 개발 서버: `pnpm dev`
- 프로덕션 빌드 확인: `pnpm build`
- 테스트 실행: `pnpm vitest run`

## 검증 현황

- 2026년 3월 22일 기준 `pnpm build` 성공
- 같은 날짜 기준 `pnpm vitest run`은 모두 통과

## 회고

이번 프로젝트는 단순히 UI를 먼저 붙이는 방식보다, 탭과 작업의 데이터 모델을 먼저 만들고 테스트로 논리를 다지는 흐름이 잘 맞았습니다. 실제 커밋 흐름도 `초기 구조 세팅 → 탭 스토어/저장소 정리 → 반복 작업 로직/테스트 → taskStore 완성 → UI 고도화 → 삭제 복구/드래그/타임존 UX 개선 → 브랜딩 정리` 순서로 흘렀고, 덕분에 후반 UI 수정에서도 핵심 로직을 비교적 안정적으로 유지할 수 있었습니다.

Codex AI와의 작업에서도 `구조 변경`, `taskStore 논리 일관성, 테스트`, `TaskItem UI 개선`, `TaskDialog 재설계`, `리포지토리 이름 정리` 같은 주제를 반복적으로 점검하면서, 로직과 화면을 분리해서 개선하는 방향이 더 선명해졌습니다.

Temporal의 월말/윤년 관련된 치명적인 엣지 케이스도 처리해가면서 날짜 처리와 관련된 작업은 앞으로 뭐든 해낼 수 있겠다는 자신감이 붙었습니다.
