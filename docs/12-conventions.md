# 12. 컨벤션 · 작업 방식

## 1. 네이밍

| 대상             | 규칙                    | 예                            |
| ---------------- | ----------------------- | ----------------------------- |
| 컴포넌트 파일    | PascalCase              | `HeroCarousel.tsx`            |
| 훅               | `use` + camelCase       | `useContacts.ts`              |
| 유틸/설정 파일   | kebab-case              | `format-currency.ts`          |
| 타입/인터페이스  | PascalCase, 접두사 없음 | `Contact` (❌ `IContact`)     |
| Firestore 컬렉션 | 복수 camelCase          | `contacts`, `supportPrograms` |
| 라우트 세그먼트  | kebab-case              | `/ai-tools`, `/group-buys`    |
| i18n 키          | 도메인.항목 camelCase   | `crm.newContact`              |
| CSS 변수         | kebab-case, 의미 기반   | `--surface-2`                 |

**금지 이름**: `data`, `item`, `temp`, `handleClick2`, `utils.ts`(포괄 유틸 파일).
이름이 안 떠오르면 무엇을 하는지 다시 생각하라는 신호다.

## 2. 컴포넌트 규칙

- 기본은 **서버 컴포넌트**. `'use client'` 는 필요한 최말단에만 붙인다.
- 한 파일 200줄 넘으면 쪼갠다.
- props 5개 넘으면 객체 하나로 묶거나 컴포넌트를 나눈다.
- 조건부 렌더는 삼항 2단 중첩까지. 그 이상이면 조기 반환이나 별도 컴포넌트로.
- 컴포넌트 안에서 Firestore를 직접 부르지 않는다. `lib/` 의 함수나 훅을 통한다.

```tsx
// ❌
const snap = await getDocs(collection(db, 'contacts'))

// ✅
const contacts = await getContactsByAgent(uid, { tier, limit: 20 })
```

## 3. 스타일 규칙

- Tailwind 유틸리티 사용. 색은 반드시 토큰 클래스(`bg-surface`, `text-content-muted`).
- 임의값(`bg-[#123456]`, `text-[13px]`) 금지. 필요하면 토큰이나 타입 스케일에 추가한다.
  글자 크기는 `text-display` ~ `text-micro` 스케일을 쓴다 (`docs/04` §3).
- `!important` 금지. **예외는 하나** — `globals.css` 의 `prefers-reduced-motion` 리셋.
  유틸리티 레이어가 base 레이어보다 뒤에 와서 `!important` 없이는 모션을 끌 수 없다.
  이 예외를 다른 곳으로 확대하지 말 것.
- 사진 위 텍스트의 `text-white` 는 허용된다 (`docs/04` §5.1 이 흰색 고정을 요구한다).
  그 외 Tailwind 기본 색상 클래스(`bg-white`, `text-gray-500`)는 금지.
- 클래스 문자열이 길어지면 `cn()` 헬퍼 + 변수로 분리. `cva` 는 variant가 3개 이상일 때만.

```bash
# 리뷰 전 자체 검사
grep -rnE "#[0-9a-fA-F]{6}" src/components src/app | grep -v "tokens.css"
```

이 명령이 결과를 뱉으면 고친다.

### 포맷터

`prettier` — 세미콜론 없음, 작은따옴표, 100칸. `prettier-plugin-tailwindcss` 가 클래스 순서를 정렬한다.

```bash
pnpm format         # 고침
pnpm format:check   # 검사만
```

**`docs/*.md` 와 `CLAUDE.md` 는 포맷 대상에서 제외한다.** Prettier가 표를 정렬할 때 한글(전각)
폭을 문자 수로 세어서 열이 오히려 어긋난다. 문서는 사람이 쓴 산문이므로 손으로 관리한다.

## 4. 타입

- `strict: true`. `any` 금지. 불가피하면 `unknown` + 좁히기.
- Firestore 데이터는 반드시 컨버터를 통과시킨다. 생 `DocumentData` 를 화면까지 끌고 가지 않는다.
- 외부 입력(폼, API 바디)은 zod로 검증하고 파싱된 타입을 쓴다.
- `Timestamp` ↔ `Date` 변환은 컨버터 안에서만. 화면 코드에 `.toDate()` 가 흩어지지 않게.

## 5. 에러 처리

- 서버 액션은 throw. 화면에서 `try/catch` 후 토스트.
- 에러 코드는 `UPPER_SNAKE` 문자열 상수. 메시지는 i18n 키로 매핑.
- 사용자에게 스택 트레이스나 Firebase 원문 에러를 보여주지 않는다.
- 로깅은 `console.error` 로 시작하되, 개인정보(전화번호, 이메일, 본문)를 로그에 남기지 않는다.

## 6. 개인정보 취급 (코드 레벨 규칙)

1. `contact.phone`, `email`, `interaction.body`, `anonymousPost.authorUid` 는 **로그 금지**.
2. 익명방 관련 데이터는 클라이언트 번들에 절대 들어가지 않는다. 서버 경유만.
3. 동의 플래그를 확인하지 않고 공개 영역에 렌더하는 코드는 리뷰 반려.
   → `assertConsent(contact, 'dataSharing')` 유틸을 만들어 공개 렌더 경로 진입 시 호출.
4. EXIF는 좌표만 추출하고 원본 메타데이터는 업로드 전에 제거한다.

## 7. 커밋

Conventional Commits.

```
feat(crm): 고객카드 등급별 연락 주기 표시 추가
fix(auth): 팝업 차단 시 리다이렉트 폴백 처리
docs(design): 팔레트 hex 실측값으로 조정
refactor(store): 메뉴 섹션 라벨을 매핑 테이블로 분리
chore(deps): next-intl 업데이트
```

스코프는 `crm` / `merchant` / `consumer` / `admin` / `auth` / `design` / `i18n` / `data` 중 하나.

한 커밋 = 한 가지 일. `pnpm build && pnpm typecheck` 가 통과하지 않으면 커밋하지 않는다.

## 8. 브랜치

- `main` — 배포 가능 상태 유지
- `feat/m4-crm-list` 처럼 **마일스톤 번호 + 내용**
- PR 설명에 해당 마일스톤의 DoD 체크리스트를 붙이고 채운다

## 9. 테스트

무겁게 가지 않는다. 다음 3가지만 반드시 테스트한다.

1. **Security Rules** — 에뮬레이터 기반. "남의 데이터가 안 보인다"를 실제로 검증.
2. **포맷 유틸** — 통화, 보증금(만원), 상대시간, 전화번호.
3. **비식별화 정규식** — 전화·주소·상호 패턴이 실제로 가려지는지.

컴포넌트 스냅샷 테스트는 만들지 않는다. 유지비용 대비 가치가 낮다.

## 10. Claude Code 작업 규칙

1. **작업 전 관련 `docs/*.md` 를 읽는다.** 추측으로 구현하지 않는다.
2. 스펙에 없는 결정이 필요하면 **멈추고 물어본다.** 특히:
   - 지도 SDK 선택
   - AI 모델·벤더
   - 서비스 정식 명칭
   - 요금·과금 구조
   - 법적 검토가 필요한 기능(쿠폰 정산, 커머스 중개)
3. 구현하면서 스펙이 바뀌면 **해당 md를 같은 커밋에서 수정한다.** 문서와 코드가 어긋나면 문서가 죽는다.
4. 마일스톤 하나를 끝내면 `docs/11` 의 진행 표를 갱신하고 멈춘다.
5. 이미지에서 읽은 값(색 hex 등)은 근사치다. 실제 화면과 대조해 조정하되,
   **조정한 내용은 `docs/04` 에 반영**한다.
6. "일단 되게 만들고 나중에 고치자"로 개인정보·권한 관련 코드를 넘기지 않는다.
   그 부분만은 처음부터 제대로 한다.

## 11. 문서에 표시된 불확실성 다루는 법

이 문서 세트에는 `미확정`, `근사치`, `확인 필요` 표시가 있다.
이건 빈칸이 아니라 **의도적으로 비워둔 자리**다.

- 임의로 채우고 확정된 것처럼 쓰지 말 것.
- 개발 진행상 값이 필요하면 임시값을 넣되, 코드에 `// TODO(confirm): ...` 주석과
  문서의 해당 항목에 결정 필요 표시를 남긴다.
- 특히 **법적 검토가 필요하다고 표시된 항목**(보험업법 겸업, 개인정보 보존기간)은
  기술적으로 구현 가능하다는 이유로 진행하지 않는다.
