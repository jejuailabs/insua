# 09. 어드민 콘솔

경로: `/[locale]/admin/*`
접근: 커스텀 클레임 `admin === true` (`docs/03` §4). 미인증·비관리자는 **404** 를 반환한다.

## 1. 셸

```
┌──────────────────────────────────────────────────────┐
│ ████ 관리자 권한으로 보고 있습니다        [일반 화면으로]│  ← 상단 4px danger 바 + 배너
├────────────┬─────────────────────────────────────────┤
│ 대시보드    │                                         │
│ 회원        │            (콘텐츠)                      │
│ 매장        │                                         │
│ 콘텐츠      │                                         │
│ 익명방      │                                         │
│ 신고        │                                         │
│ 지원정보    │                                         │
│ 공동구매    │                                         │
│ 감사 로그   │                                         │
└────────────┴─────────────────────────────────────────┘
```

배너는 **스크롤해도 항상 보인다.** 관리자가 자기 권한 상태를 잊고 조작하는 걸 막는 장치다.

## 2. 메뉴별 기능

### 2.1 대시보드

- 오늘/이번주 가입자 수 (역할별)
- 신규 매장 수, 게시물 수, 익명방 글 수
- **미처리 신고 건수** — 0이 아니면 빨간 배지
- 출처 없는 `supportPrograms` 개수 (노출 차단된 레코드 수)

### 2.2 회원 관리 `/admin/users`

- 검색(이메일, 이름), 필터(역할, 가입일, 상태)
- 행 클릭 → 상세: 프로필, 역할, 담당 설계사, 가입일, 최근 활동
- 가능한 조작:
  - **역할 변경** — 사용자는 못 하고 관리자만 가능 (`docs/03` §3)
  - **관리자 지정/해제** — 커스텀 클레임 변경. 자기 자신의 관리자 권한은 **해제할 수 없다**
    (마지막 관리자가 스스로를 내려 시스템이 잠기는 걸 방지)
  - 계정 정지 (`deletedAt` 설정)
- 모든 조작은 `auditLogs` 기록.

### 2.3 매장 관리 `/admin/stores`

- 상태 필터: `draft` / `published` / `suspended`
- 공개 전환, 정지, 대표 노출 지정
- 연결된 `contact.consent` 상태를 함께 표시한다. **동의 없이 공개된 매장을 찾아내기 위한 화면이다.**
  `consent.dataSharing === false` 인데 `isPublic === true` 인 레코드는 경고 표시.

### 2.4 콘텐츠 `/admin/posts`

- 최신순 목록, 이미지 썸네일 그리드
- 숨김(`status: 'hidden'`) / 삭제(`removed`) 처리
- 신고 누적 3건 이상은 자동 상단 정렬

### 2.5 익명방 `/admin/anonymous` ★ 가장 조심할 화면

- 기본 목록에는 **작성자 정보가 나오지 않는다.** 본문·시각·신고수만.
- 비식별화가 제대로 됐는지 검토할 수 있게 `redactions` 요약을 표시.
- **작성자 역추적(reveal)** 은 별도 버튼이며:
  1. 사유 입력 필수(자유 텍스트 아님 — 사유 코드 선택 + 상세)
  2. 확인 다이얼로그에 "이 조회는 기록됩니다" 명시
  3. `auditLogs` 에 `action: 'anonymous.reveal'` 로 반드시 기록
  4. 조회 결과는 화면에만 표시, 복사·내보내기 없음
- 이 절차는 제안서 10장의 "익명방 관리 리스크"에 대한 최소 통제다. 간소화하지 말 것.

### 2.6 신고 `/admin/reports`

- 상태: `open` → `reviewing` → `resolved` / `rejected`
- 처리 시 대상 콘텐츠를 같은 화면에서 바로 숨김/삭제 가능
- 처리자·처리시각 기록

### 2.7 지원정보 `/admin/support-programs`

- 수동 등록/수정. 필드는 `docs/02` §7.
- **`sourceUrl` 없이 저장 불가.** 폼 검증에서 막는다.
- 마감일 지난 항목 일괄 `closed` 처리 버튼

### 2.8 공동구매 `/admin/group-buys`

- 등록/마감/참여자 수 확인

### 2.9 감사 로그 `/admin/audit-logs`

- 읽기 전용. 필터: 관리자, 액션, 기간
- **삭제 불가** (Security Rules에서 `write: if false`)

## 3. 구현 방식

- 전부 **서버 컴포넌트 + Admin SDK**. 클라이언트에서 Firestore를 직접 읽지 않는다.
  Security Rules로도 막지만, 관리자용 쿼리는 애초에 서버에서만 나가는 게 맞다.
- 변경은 Server Action. 각 액션 첫 줄에서 `requireAdmin()`.

```ts
'use server'
import { requireAdmin } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'
import { writeAudit } from '@/lib/admin/audit'

export async function hidePost(postId: string, reason: string) {
  const { uid } = await requireAdmin()
  const ref = adminDb.collection('posts').doc(postId)
  const before = (await ref.get()).data()
  await ref.update({ status: 'hidden', updatedAt: new Date() })
  await writeAudit({
    actorUid: uid,
    action: 'post.hide',
    targetType: 'post',
    targetId: postId,
    before,
    after: { status: 'hidden', reason },
  })
}
```

`writeAudit` 를 빼먹은 파괴적 액션은 리뷰에서 반려 대상이다.

## 4. 어드민 화면의 디자인

- 일반 앱과 같은 토큰을 쓰되 **밀도를 높인다**: 카드 대신 테이블, 라디우스 10px, 폰트 14px.
- 사진 중심 히어로 카드를 쓰지 않는다. 관리자는 스캔하는 사람이지 감상하는 사람이 아니다.
- 다크/라이트 토글은 동일하게 동작한다.
- 파괴적 버튼(삭제, 정지, 역추적)은 `--danger` 아웃라인. 채운 배경은 확인 다이얼로그 안에서만.

## 5. 이번 범위에서 만들지 않는 것

- 통계 대시보드의 차트 고도화 (숫자 카드까지만)
- 대량 CSV 임포트/익스포트
- 역할 세분화(운영자/모더레이터 구분) — `admin` 한 등급만
