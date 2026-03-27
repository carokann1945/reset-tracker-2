# Project Guidelines

## Environment

- WSL2 Ubuntu — Linux 경로 사용 (`/home/user/...`)
- Windows 경로(`C:\\...`) 또는 WSL 마운트 경로(`/mnt/c/...`) 사용 금지
- Shell: bash

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm

## Commands

```bash
pnpm install       # 의존성 설치
pnpm add <pkg>     # 패키지 추가
pnpm add -D <pkg>  # dev 의존성 추가
pnpm remove <pkg>  # 패키지 제거
pnpm dev           # 개발 서버 시작
pnpm build         # 프로덕션 빌드
pnpm start         # 프로덕션 서버 시작
pnpm lint          # ESLint 실행
pnpm type-check    # TypeScript 타입 검사 (tsc --noEmit)
```

## Project Structure

feature 기반 구조

```
src
├─ actions
├─ app
│  ├─ (auth)
│  ├─ (domain)
│  ├─ globals.css
│  └─ layout.tsx
├─ features
│  └─ tracker
│     ├─ components
│     │  ├─ sidebar
│     │  └─ task
│     ├─ hooks
│     └─ model
├─ lib/
├─ types/
└─ public/
```

## TypeScript

- `any` 사용 금지 — `unknown` + 타입 내로잉 사용
- 객체 형태는 `interface`, 유니온/인터섹션/별칭은 `type`
- 함수 반환 타입 및 공개 API에 명시적 타입 지정
- 컴포넌트 props는 항상 명시적으로 타입 지정
- children props에는 `React.ReactNode` 사용

```typescript
// Bad
const process = (data: any) => { ... }

// Good
const process = (data: unknown): Result => { ... }

interface Props {
  children: React.ReactNode
  title: string
  count?: number
}

export default function MyComponent({ children, title, count = 0 }: Props) {
  // ...
}
```

## Tailwind CSS v4

`tailwind.config.js` 불필요 — CSS 우선 설정 방식 사용.

`app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  --color-brand: #6366f1;
  --font-sans: 'Inter', sans-serif;
}
```

`postcss.config.mjs`:

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

클래스명 작성 규칙 (cn 유틸리티 및 순서)
Tailwind 클래스는 충돌 방지와 조건부 스타일링을 위해 cn 유틸리티(clsx + tailwind-merge)를 사용하여 작성하며, 일관성과 가독성을 위해 다음 순서를 엄격히 따릅니다.
크기 (너비/높이): w-full, max-w-md, h-10, min-h-screen
여백 (패딩/마진): p-4, px-2, m-4, mt-2, gap-4
레이아웃 (플렉스/그리드): flex, flex-col, grid, items-center, justify-between
위치 및 계층: relative, absolute, fixed, top-0, z-10
시각적 요소 (색상, 타이포그래피, 테두리): bg-white, text-sm, font-bold, border, rounded-md, shadow-sm
애니메이션 및 전환 효과: transition-all, duration-300, animate-in
조건부 클래스: 컴포넌트의 상태(props, state)에 따라 동적으로 부여되는 클래스

## Next.js App Router

Root layout은 반드시 `<html>`, `<body>` 태그 포함:

```typescript
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

파일 컨벤션:

- `layout.tsx` — 세그먼트와 하위 공유 UI
- `page.tsx` — 라우트 고유 UI (라우트 공개 접근 가능)
- `loading.tsx` — Suspense 바운더리
- `error.tsx` — 에러 바운더리 (`"use client"` 필수)
- `not-found.tsx` — 404 UI

## Server vs Client Components

- 기본값: Server Component — 데이터 페칭, 정적 렌더링에 사용
- `"use client"`: 상호작용, 브라우저 API, React 훅 필요 시에만 사용
- `"use client"` 경계는 가능한 한 트리 하단에 위치

## Code Style

- 파일명: `kebab-case.ts` / `kebab-case.tsx`
- 컴포넌트/클래스명: `PascalCase`
- 컴포넌트는 named export, 라우트 파일(`page.tsx`, `layout.tsx`)은 default export
- 배럴 파일(`index.ts`) 명시적으로 필요한 경우에만 사용
- 미사용 import, 변수, 데드 코드 금지
- 명백하지 않은 로직에만 주석 추가
- 컴포넌트별 로직과 타입은 같은 파일에 배치
