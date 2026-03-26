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

```
app/
├── layout.tsx          # Root layout (html + body 태그 필수)
├── page.tsx            # 홈 페이지
├── globals.css         # 전역 스타일 — Tailwind import
├── (routes)/
│   └── [slug]/
│       └── page.tsx
components/
├── ui/                 # 재사용 가능한 UI 원자 컴포넌트
└── [feature]/          # 기능별 컴포넌트
lib/                    # 유틸리티, 헬퍼, 공유 로직
types/                  # 공유 TypeScript 타입
public/                 # 정적 에셋
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
