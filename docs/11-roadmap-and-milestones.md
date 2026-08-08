# 11. 로드맵 · 작업 순서

> **Claude Code는 여기서부터 시작한다.** M0부터 순서대로. 마일스톤 하나가 끝나면
> 멈추고 결과를 보고한 뒤 다음으로 넘어간다. 몰아서 하지 말 것.

각 마일스톤 끝에는 **완료 조건(DoD)** 이 있다. 전부 만족해야 다음으로 간다.

---

## M0 — 프로젝트 부트스트랩

**작업**

1. Next.js(App Router, TypeScript, Tailwind) 프로젝트 생성, pnpm
2. `docs/01` §3 폴더 구조 생성
3. ESLint + Prettier + `tsc --noEmit` 스크립트
4. `.env.local.example` 작성 (`docs/01` §4)
5. `src/styles/tokens.css` 에 `docs/04` §2 색 토큰 전체 입력, Tailwind 연결
6. Pretendard 폰트 로드 설정

**DoD**

- [x] `pnpm dev` 로 빈 페이지가 뜬다
- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` 전부 통과
- [x] 4개 팔레트 × light/dark = 8조합의 CSS 변수가 정의돼 있다 (브라우저에서 13개 변수 × 8조합 실측, 누락 0)

**M0에서 확정된 것 / M1로 넘긴 것**

- Next.js 16.3.0 · React 19.2.8 · **Tailwind v4** — v4는 CSS-first 라 `tailwind.config.ts` 가 없다.
  `docs/04` §2.3 을 `@theme` 방식으로 갱신했다.
- 타이포 스케일을 `text-display` ~ `text-micro` 유틸리티로 구현 (`docs/04` §3).
- Pretendard는 npm 패키지의 **동적 서브셋 92조각**을 자체 호스팅. 통짜 2MB 파일은 쓰지 않는다.
- 🔴 **light 모드 3개 팔레트에서 강조색 위 흰 텍스트 대비가 3.0~3.4:1** 로 기준 미달.
  해결에 디자인 결정이 필요해 M1로 넘겼다. → `docs/04` §2.2 의 "해결 필요 (M1)" 참조.

---

## M1 — 테마 + 다국어 기반

**작업**

1. `next-themes` 연결, `ThemeToggle` 세그먼트 컨트롤 3칸 (`docs/04` §6)
2. `PaletteProvider` + FOUC 방지 인라인 스크립트
3. `next-intl` 설정, `/[locale]` 라우팅, 미들웨어
4. `messages/ko.json` 을 `docs/05` §3 내용으로 작성, `en/zh/ja` 는 같은 키 구조로 생성
5. `scripts/check-i18n.ts` + `pnpm i18n:check`
6. 토큰 확인용 임시 페이지 `/[locale]/_kitchen-sink` — 색·타이포·컴포넌트 프리뷰

**DoD**

- [x] 새로고침해도 테마·팔레트가 깜빡이지 않는다 (FOUC 스크립트가 `</head>` 앞에서 동기 실행됨을 SSR HTML로 확인)
- [x] `/ko`, `/en`, `/zh`, `/ja` 전부 열린다 (4개 locale × 2개 라우트 = 8개 정적 생성, `/` 는 307)
- [x] 8개 테마 조합에서 kitchen-sink 페이지의 텍스트 대비가 4.5:1 이상 (**실측 176건 전부 통과, 최저 4.61**)
- [x] `pnpm i18n:check` 에서 `ko` 기준 누락 키가 출력된다 (키 151개, 4개 언어 일치)

**M1에서 확정된 것**

- `next-intl` 4.13 / `next-themes` 0.4. Next 16 이 `middleware` → **`proxy`** 로 규약을 바꿔 `src/proxy.ts` 를 쓴다.
- 대비 실측은 **렌더된 DOM 요소**를 대상으로 한다. 토큰 값만 비교하면 `--accent-soft` 같은
  반투명 배경을 놓친다. 부모 배경 위에 알파 합성한 뒤 계산해야 실제 화면과 일치한다.
- 그 방식으로 다시 재니 원래 스펙의 **두 곳이 기준 미달**이었다. 둘 다 토큰을 추가해 해결했다.
  - 강조색 위 흰 텍스트 → `--accent-strong` (`docs/04` §2.2)
  - 등급 배지 위 흰 텍스트 → `--tier-*-on` (`docs/04` §5.2). 앰버 B등급이 1.85:1 이었다.
- kitchen-sink 경로는 `_kitchen-sink` 가 아니라 **`/[locale]/kitchen-sink`**.
  App Router 에서 `_` 로 시작하는 폴더는 private folder 라 라우팅되지 않는다.
- 마운트 판정은 `useState`+`useEffect` 대신 `useIsMounted()`(`useSyncExternalStore`).
  React 19 의 `react-hooks/set-state-in-effect` 규칙에 걸리고 렌더도 한 번 더 돈다.
- `theme-color` 메타 갱신에 `requestAnimationFrame` 을 쓰지 않는다. 백그라운드 탭에서는
  프레임을 안 그려 콜백이 아예 실행되지 않는다.

> zh / ja 번역은 구조를 채운 것이고 **원어민 검수를 받지 않았다.** 실서비스 전에 검수 필요.

---

## M2 — Firebase + Google 로그인 + 역할

**작업**

1. Firebase 프로젝트 연결, 클라이언트/Admin 초기화 (`docs/01` §6)
2. Google 로그인 + 팝업 실패 시 리다이렉트 폴백 (`docs/03` §2)
3. `/api/session` POST/DELETE, 세션 쿠키
4. `users` 문서 자동 생성 + `ADMIN_BOOTSTRAP_EMAILS` 부트스트랩
5. `/onboarding` 역할 선택 3카드 → 커스텀 클레임 설정
6. 미들웨어 인증 가드 (i18n과 통합)
7. `firestore.rules`, `storage.rules` 초안 작성 + 에뮬레이터 설정

**DoD**

- [ ] 구글 로그인 → 온보딩 → 역할별 홈으로 자동 이동
- [ ] 로그아웃 후 보호 경로 접근 시 로그인으로 리다이렉트
- [ ] 클라이언트에서 `users.role` 직접 수정 시도가 Rules에서 거부된다
- [ ] 에뮬레이터에서 Rules 테스트가 통과한다

---

## M3 — 공통 컴포넌트 세트

`docs/04` §5 의 컴포넌트를 실제로 만든다. **화면보다 컴포넌트가 먼저다.**

**작업**

1. `ui/`: Button, Card, Badge, Chip, Sheet, Dialog, Avatar, Skeleton, EmptyState, Toast
2. `layout/`: AppShell, SideRail, BottomNav, TopBar
3. `HeroCarousel` (시그니처 — 여기에 시간을 제일 많이 쓴다)
4. `TierBadge`, `PersonCard`, `QuickActionGrid`, `SectionCard`, `ComposerSheet`
5. `MapPlaceholder`
6. kitchen-sink 페이지에 전부 배치해 8개 테마에서 확인

**DoD**

- [ ] `HeroCarousel` 이 터치 스와이프 / 버튼 / 키보드 화살표로 모두 동작한다
- [ ] 좌우 이웃 카드가 물려 보인다 (`ref-01`, `ref-04` 와 대조)
- [ ] `prefers-reduced-motion` 에서 모든 애니메이션이 꺼진다
- [ ] 컴포넌트 어디에도 hex 색상 리터럴이 없다 (grep으로 확인)

---

## M4 — 설계사 CRM (`docs/06`)

**작업**

1. `contacts` 타입 + 컨버터 + 시드 데이터 (`lib/mock`)
2. CRM 목록 화면: 레일 + 액션바 + 필터칩 + `PersonCard` 리스트
3. 정렬(연락 임박순 기본), 검색 시트
4. 신규 등록 폼 (동의 체크 3개 포함, 기본 해제)
5. 상담로그 화면 + 컴포저 (텍스트/사진/파일. 음성은 동의 있을 때만)
6. 캘린더(연락 예정일 월간 뷰)
7. 빈 상태 3종

**DoD**

- [ ] 다른 계정으로 로그인하면 남의 고객이 보이지 않는다 (Rules로 차단됨을 실제로 확인)
- [ ] `consent.recording === false` 인 고객에서 상담 녹음 버튼이 비활성이다
- [ ] 연락 지연 고객에 표시가 뜬다
- [ ] 고객 0명일 때 빈 상태와 CTA가 나온다

---

## M5 — 소상공인 (`docs/07`)

**작업**

1. 커뮤니티 홈: 인사 + 퀵액션 6칸 + 익명방 카드 + 4개 섹션
2. 하단 탭바 + 글쓰기 FAB + `ComposerSheet`
3. 내 매장 편집 화면 (`HeroCarousel` + 메뉴 + 소개 + 지도 placeholder)
4. 업종별 메뉴 섹션 라벨 매핑
5. 모듈 수정(순서/노출 토글)
6. 공개 매장 페이지 `/s/[storeId]` (ISR, OG 메타)
7. 사진 업로드 파이프라인 (EXIF GPS 추출 → EXIF 제거 → 리사이즈 → 업로드)
8. 익명방 목록/작성 + 정규식 비식별화 + 마스킹 미리보기
9. `listings`, `supportPrograms`, `groupBuys` 목록 (시드 데이터 기반)

**DoD**

- [ ] 사진 1장 업로드 → 매장 페이지와 피드에 동시에 뜬다
- [ ] 업로드된 이미지에 EXIF가 남아 있지 않다 (실제로 확인)
- [ ] 익명 작성 시 시각적 구분 + 전송 전 확인 다이얼로그가 뜬다
- [ ] `sourceUrl` 없는 지원정보가 화면에 렌더되지 않는다
- [ ] `/s/[storeId]` 가 비로그인으로 열리고 OG 태그가 생성된다

---

## M6 — 소비자 LOCAL HERO (`docs/08`)

**작업**

1. 좌측 레일 + `HeroCarousel` 소비자 변형(카테고리 배지, 정보 타일)
2. `heroTiles.ts` 카테고리별 타일 매핑
3. 반경 필터 1/3/5km + geohash 쿼리 + 권한 거부 폴백
4. 상품 그리드 + 찜
5. 쿠폰 발급 시트
6. 마이페이지 (언어/테마/담당 설계사 지정 + 고지문)
7. 비로그인 열람 + 기능별 로그인 유도

**DoD**

- [ ] 반경 칩을 눌러야 위치 권한을 요청한다 (진입 즉시 요청 X)
- [ ] 권한 거부 시 지역 선택으로 폴백된다
- [ ] 담당 설계사 지정 시 정보 전달 고지가 명시적으로 노출되고 동의 없이는 진행되지 않는다
- [ ] 결제/장바구니 UI가 어디에도 없다

---

## M7 — 어드민 콘솔 (`docs/09`)

**작업**

1. 어드민 셸 + 상시 경고 배너
2. 회원 / 매장 / 콘텐츠 / 익명방 / 신고 / 지원정보 / 공동구매 / 감사 로그
3. `writeAudit` 유틸 + 모든 파괴적 액션에 연결
4. 익명방 역추적 절차(사유 입력 → 확인 → 감사 로그)
5. 동의 불일치 매장 경고 표시

**DoD**

- [ ] 비관리자가 `/admin` 접근 시 404
- [ ] 감사 로그가 클라이언트에서 삭제 불가 (Rules 확인)
- [ ] 자기 자신의 관리자 권한을 해제할 수 없다
- [ ] 파괴적 액션 후 `auditLogs` 에 레코드가 남는다

---

## M8 — 마감

**작업**

1. `docs/10` AI 어댑터 + MockAdapter + `unavailable` UI
2. AI 툴 게이트(`canUseAiTools`)
3. 에러 바운더리, 404/500 페이지
4. 로딩 스켈레톤 전면 적용
5. Vercel 배포 + 환경변수 등록 + Firebase 승인된 도메인 추가
6. Lighthouse 점검 (모바일 기준 Performance/Accessibility)
7. README 작성

**DoD**

- [ ] 프로덕션 배포에서 구글 로그인이 동작한다
- [ ] AI 툴이 가짜 결과를 만들지 않고 "준비 중"을 표시한다
- [ ] Accessibility 점수 90 이상
- [ ] 모든 화면이 8개 테마 조합에서 깨지지 않는다

---

## 이후 (이번 저장소 범위 밖)

원 제안서의 Phase 2~5. 착수 전 별도 논의 필요.

| 단계   | 내용                   | 선행 조건                                      |
| ------ | ---------------------- | ---------------------------------------------- |
| 확산   | SNS 캐러셀 자동발행    | 통합 계정 운영 주체 결정, 플랫폼 API 정책 확인 |
| 구조화 | 상권지도, AI 툴 실구현 | 지도 SDK 선정, 모델·요금 결정                  |
| 거래화 | 결제·정산              | 사업자 등록, PG 계약, 통신판매업 신고          |
| 독립   | 배달                   | 별도 사업계획. 이번 코드베이스와 분리 검토     |

**모든 단계에 앞서 보험업법 겸업 이슈 검토가 선행되어야 한다** (제안서 10장).
설계사가 커머스 중개·쿠폰 비용분담을 수행하는 구조는 법적 검토 없이 실서비스화하면 안 된다.
이 저장소의 쿠폰 비용분담이 "필드 저장만, 정산 미구현"인 이유가 이것이다.

---

## 진행 상황 기록

작업하며 아래를 갱신한다.

| 마일스톤 | 상태 | 완료일 | 비고 |
| -------- | ---- | ------ | ---- |
| M0       | ✅   | 2026-08-08 | Next 16.3 / Tailwind v4. 강조색 대비 이슈 M1로 이월 |
| M1       | ✅   | 2026-08-08 | 대비 176건 실측 전부 통과. `--accent-strong` / `--tier-*-on` 추가. zh·ja 원어민 검수 미완 |
| M2       | ⬜   |        |      |
| M3       | ⬜   |        |      |
| M4       | ⬜   |        |      |
| M5       | ⬜   |        |      |
| M6       | ⬜   |        |      |
| M7       | ⬜   |        |      |
| M8       | ⬜   |        |      |
