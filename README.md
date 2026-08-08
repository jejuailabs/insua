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
| `pnpm dummy:gen`    | 더미 이미지 생성 (OpenAI) — 로컬 `.dummy-images/` |
| `pnpm dummy:upload` | 더미 이미지 Storage 업로드 + URL 맵 갱신 |

## 더미 이미지

화면 개발용 플레이스홀더 사진은 **저장소에 두지 않는다.** Vercel 번들 용량을 먹기 때문이다.
`.dummy-images/`(gitignore)에서 생성해 Firebase Storage `dummy/` 로 올리고,
앱은 `src/lib/mock/dummy-images.ts` 의 URL 만 참조한다. 이 파일은 업로드 스크립트가 자동 생성한다.

```bash
pnpm dummy:gen && pnpm dummy:upload
```

자세한 건 생성 후 `.dummy-images/README.md`. 읽기는 다운로드 토큰 URL 이라
`storage.rules` 는 손대지 않았다 — 토큰 없이 접근하면 403.

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

프로덕션: https://insua.vercel.app

Vercel 프로젝트는 **`jejuai` 계정의 `insua`**, GitHub 저장소 `jejuailabs/insua` 와 연동돼 있다.
`main` 에 푸시하면 자동 배포된다. **CLI 로 수동 배포하지 말 것.**

```bash
git push origin main   # 이게 배포다
```

> ⚠️ 로컬 `vercel` CLI 는 다른 계정(`naggu1999-2767` / `funjejus-projects`)으로 로그인돼 있다.
> 그 상태로 `vercel deploy` 를 하면 엉뚱한 스코프에 **중복 프로젝트가 생긴다.**
> CLI 를 써야 한다면 먼저 `vercel whoami` 로 계정을 확인할 것.

## 지금 어디까지 왔나

M0(부트스트랩) · M1(테마 + 다국어) 완료. 다음은 **M2 — Firebase Google 로그인 + 역할 온보딩**.
진행 상황은 `docs/11` 의 표를 본다.

동작하는 것:

- `/ko` `/en` `/zh` `/ja` — locale 라우팅 (`next-intl`, prefix always)
- 테마 3상태(라이트/다크/시스템) + 팔레트 4종. 새로고침해도 깜빡임 없음
- `/{locale}/kitchen-sink` — 토큰 확인용 개발 페이지. 8조합 대비 실측 통과
