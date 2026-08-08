# local-os

AI 로컬 비즈니스 플랫폼. 보험설계사 CRM에서 출발해 지역 상권 콘텐츠·커머스로 이어지는
3-Sided 플랫폼(설계사 · 소상공인 · 소비자 + 운영자).

> 코드네임 `local-os`. 서비스 정식 명칭은 미확정이다 (`CLAUDE.md` §7).

## 시작하기

```bash
pnpm install
cp .env.local.example .env.local   # 값은 Firebase 콘솔에서 (M2부터 필요)
pnpm dev
```

http://localhost:3000

## 명령어

| 명령                | 하는 일                              |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | 개발 서버                            |
| `pnpm build`        | 프로덕션 빌드 — **커밋 전 반드시 통과** |
| `pnpm lint`         | ESLint                               |
| `pnpm typecheck`    | `tsc --noEmit`                       |
| `pnpm format`       | Prettier (문서 `*.md` 는 제외)       |
| `pnpm emu`          | Firebase 에뮬레이터 — M2부터 동작    |

## 스택

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-first `@theme`) ·
Firebase Auth/Firestore/Storage · next-themes · next-intl · Vercel 배포.

Tailwind v4라서 `tailwind.config.ts` 가 없다. 디자인 토큰은 아래 두 파일이 전부다.

- `src/styles/tokens.css` — 색·간격·모션. **색 리터럴은 여기에만 있다.**
- `src/styles/globals.css` — `@theme` 블록이 토큰을 Tailwind 유틸리티로 노출한다.

테마는 팔레트 4종(`basalt` / `gyul` / `gotjawal` / `badang`) × light/dark = 8조합.

## 문서

작업 전에 읽는다. 스펙이 바뀌면 코드와 같은 커밋에서 문서도 고친다.

- `CLAUDE.md` — 절대 규칙. 제일 먼저 읽는다.
- `docs/11-roadmap-and-milestones.md` — **작업 순서. 여기부터.**
- `docs/00`~`docs/10` — 제품·아키텍처·데이터모델·인증·디자인·화면별 스펙
- `docs/12-conventions.md` — 네이밍, 스타일, 커밋 규칙

## 배포

프로덕션: https://insua-chi.vercel.app

Vercel 프로젝트는 `funjejus-projects/insua`. 현재는 **CLI 수동 배포**다.

```bash
vercel deploy --prod
```

> GitHub 저장소(`jejuailabs/insua`)와 Vercel 계정의 소유 조직이 달라서 Git 자동배포 연결이
> 아직 안 돼 있다. 연결하면 `main` 푸시마다 자동 배포된다. → 아래 "남은 배포 작업"

## 지금 어디까지 왔나

M0(부트스트랩) · M1(테마 + 다국어) 완료. 다음은 **M2 — Firebase Google 로그인 + 역할 온보딩**.
진행 상황은 `docs/11` 의 표를 본다.

동작하는 것:

- `/ko` `/en` `/zh` `/ja` — locale 라우팅 (`next-intl`, prefix always)
- 테마 3상태(라이트/다크/시스템) + 팔레트 4종. 새로고침해도 깜빡임 없음
- `/{locale}/kitchen-sink` — 토큰 확인용 개발 페이지. 8조합 대비 실측 통과
