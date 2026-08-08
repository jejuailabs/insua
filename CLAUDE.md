# CLAUDE.md — AI 로컬 비즈니스 플랫폼 (코드네임: `local-os`)

> 이 파일은 Claude Code가 **세션 시작 시 항상 먼저 읽는 프로젝트 헌법**이다.
> 상세 스펙은 `docs/` 에 있다. 이 파일은 "무엇을 절대 어기면 안 되는가"만 담는다.

---

## 0. 이 프로젝트가 뭔가

보험설계사의 고객관리(CRM)에서 출발해, 그 과정에서 자연스럽게 쌓이는 데이터를
지역 상권 콘텐츠·커머스로 전환하는 **3-Sided 로컬 플랫폼**.

- **설계사(agent)** — 고객카드 CRM. 원래 하던 업무(방문·상담) 그대로, 사진 한 장만 추가.
- **소상공인(merchant)** — 내 매장 페이지 + 커뮤니티 대시보드 + AI 마케팅 툴.
- **소비자(consumer)** — 반경 기반 로컬 피드(LOCAL HERO) + 쿠폰 + 직거래.
- **관리자(admin)** — 위 3개를 가로지르는 운영 콘솔.

근거 문서: `docs/00-product-overview.md` (원본 사업제안서 요약)

## 1. 이번 개발 범위 (반드시 지킬 것)

이 저장소에서 **지금 만드는 것은 Phase 1 MVP + 플랫폼 기반**이다.

**만든다**

1. Firebase Google 로그인 + 역할(role) 온보딩 + 어드민 모드
2. 다크/라이트 테마 토글 (시스템 설정 연동)
3. 다국어(i18n) — `ko` 기본, `en` / `zh` / `ja` 확장 슬롯
4. 설계사 CRM 화면 (`docs/06`)
5. 소상공인 대시보드 + 내 매장 페이지 (`docs/07`)
6. 소비자 로컬 피드 (`docs/08`)
7. 어드민 콘솔 (`docs/09`)

**만들지 않는다 (스텁/플레이스홀더만)**

- 배달 플랫폼 (원 제안서 Phase 5) — 라우트조차 만들지 말 것
- 실제 결제/정산 — 쿠폰은 발급·사용처리까지만, PG 연동 없음
- 인스타/쓰레드 자동발행 — 인터페이스만 정의, 실제 API 호출 없음
- AI 이미지 생성 실호출 — `docs/10` 의 어댑터 인터페이스까지만

> 스코프를 넘는 코드를 쓰지 말 것. 필요해 보이면 **먼저 물어볼 것.**

## 2. 기술 스택 (고정)

| 영역       | 선택                                               | 비고                                      |
| ---------- | -------------------------------------------------- | ----------------------------------------- |
| 프레임워크 | Next.js 16.3 (App Router) + React 19 + TypeScript  | M0에서 고정됨                             |
| 배포       | Vercel                                             | Firebase Hosting 사용하지 않음            |
| 스타일     | Tailwind CSS **v4** (CSS-first)                    | `tailwind.config.ts` 없음. 토큰은 `src/styles/` 의 CSS 변수 + `@theme`, `docs/04` 준수 |
| 인증       | Firebase Authentication (Google Provider)          |                                           |
| DB         | Cloud Firestore                                    | 스키마는 `docs/02`                        |
| 파일       | Firebase Storage                                   | 이미지/음성메모                           |
| 서버 권한  | Firebase Admin SDK (Route Handler / Server Action) | 서비스 계정 키는 환경변수                 |
| 테마       | `next-themes`                                      |                                           |
| 다국어     | `next-intl`                                        | `/[locale]/...` 라우팅                    |
| 상태       | 서버 컴포넌트 우선 + 필요한 곳만 클라이언트        | 전역 상태 라이브러리 도입 금지            |

세부: `docs/01-tech-stack-and-architecture.md`

## 3. 절대 규칙

1. **Firebase Admin SDK 키는 클라이언트로 절대 노출 금지.** `NEXT_PUBLIC_` 접두사를 Admin 관련 값에 붙이지 말 것.
2. **권한 판정은 Firestore Security Rules + 서버에서 이중으로.** 클라이언트 `if (user.role === 'admin')` 만으로 보호된 화면을 만들지 말 것.
3. **하드코딩된 한국어 문자열 금지.** 모든 UI 텍스트는 `messages/{locale}.json` 을 통한다. (예외: 개발용 로그)
4. **하드코딩된 색상값 금지.** 모든 색은 `docs/04` 의 CSS 변수(`--surface`, `--accent` 등)를 통한다.
5. **개인정보 필드는 스키마에 명시된 것만 저장.** 통화 녹음·상담 원문은 `docs/02` 의 동의 플래그 없이 저장 금지.
6. **모의 데이터는 `lib/mock/` 안에서만.** 프로덕션 경로에 더미 데이터를 섞지 말 것.
7. 작업 전 관련 `docs/*.md` 를 읽고, 작업 후 스펙이 바뀌었으면 **해당 md를 같이 수정**할 것.

## 4. 문서 지도

| 파일                                     | 언제 읽나                               |
| ---------------------------------------- | --------------------------------------- |
| `docs/00-product-overview.md`            | 제품 맥락·용어가 헷갈릴 때              |
| `docs/01-tech-stack-and-architecture.md` | 폴더 구조, 환경변수, 배포               |
| `docs/02-data-model.md`                  | Firestore 컬렉션/필드/보안규칙          |
| `docs/03-auth-roles-admin.md`            | 구글 로그인, 역할 온보딩, 커스텀 클레임 |
| `docs/04-design-system.md`               | 색·타이포·컴포넌트·**다크/라이트 토글** |
| `docs/05-i18n.md`                        | 다국어 키 구조, 라우팅                  |
| `docs/06-screen-agent-crm.md`            | 설계사 CRM 화면                         |
| `docs/07-screen-merchant.md`             | 소상공인 대시보드 + 내 매장             |
| `docs/08-screen-consumer.md`             | 소비자 LOCAL HERO 피드                  |
| `docs/09-admin-console.md`               | 어드민 모드                             |
| `docs/10-ai-features.md`                 | AI 툴 어댑터 (실호출 없음)              |
| `docs/11-roadmap-and-milestones.md`      | **작업 순서 — 여기부터 시작**           |
| `docs/12-conventions.md`                 | 네이밍, 커밋, 컴포넌트 규칙             |

디자인 원본 이미지: `docs/assets/ref-01~04*.png`

## 5. 시작 방법

새 세션이면 `docs/11-roadmap-and-milestones.md` 의 **M0부터 순서대로** 진행한다.
마일스톤 하나가 끝나면 멈추고 결과를 보고한 뒤 다음으로 넘어간다. 한 번에 여러 마일스톤을 몰아서 하지 말 것.

## 6. 명령어

```bash
pnpm dev          # 로컬 개발 (http://localhost:3000)
pnpm build        # 프로덕션 빌드 — 커밋 전 반드시 통과
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm emu          # Firebase 에뮬레이터 (Auth+Firestore+Storage)
```

## 7. 확실하지 않은 것 (추측하지 말 것)

아래는 이 문서를 쓴 시점에 **확정되지 않은 사항**이다. 임의로 정하지 말고 사용자에게 물어볼 것.

- 서비스 정식 명칭 (현재 코드네임 `local-os`, 소비자 앱 표기는 이미지 기준 `LOCAL HERO`)
- 보험업법상 겸업 가능 범위 — 쿠폰 비용분담·커머스 중개 기능의 법적 검토 미완 (원 제안서 10장)
- 설계사 요금제 실제 금액
- 다국어 확장 언어 우선순위 (제주 관광객 대상이면 `zh`/`ja` 우선일 가능성이 있으나 미확정)
