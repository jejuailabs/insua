# 02. 데이터 모델 (Firestore)

> 타입은 `src/types/` 에 이 문서와 1:1로 정의한다. 스키마를 바꾸면 이 문서도 같이 고친다.

## 0. 공통 규칙

- 문서 ID는 Firestore 자동 ID. 단 `users` 는 Firebase Auth의 `uid` 를 그대로 쓴다.
- 모든 문서에 `createdAt`, `updatedAt` (`serverTimestamp()`).
- 삭제는 물리 삭제 대신 `deletedAt` 소프트 삭제. 익명방 신고 대응 때문에 필요하다.
- 좌표는 `{ lat: number, lng: number }` + `geohash: string` (반경 쿼리용).
- 다국어 텍스트가 필요한 필드(예: 카테고리명)는 앱 코드의 번역키로 처리한다. **DB에 다국어 문자열을 넣지 않는다.**

---

## 1. `users/{uid}`

```ts
type Role = 'agent' | 'merchant' | 'consumer'

interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: Role | null // 온보딩 전에는 null
  isAdmin: boolean // 표시용 미러. 실제 판정은 커스텀 클레임 (docs/03)
  locale: 'ko' | 'en' | 'zh' | 'ja'
  themePreference: 'light' | 'dark' | 'system'
  palette: PaletteId // docs/04
  region: { sido: string; sigungu: string } | null
  agentId: string | null // merchant/consumer가 담당 설계사를 지명한 경우
  onboardedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null
}
```

`agentId` 가 이 제품의 수익모델 핵심이다. 값이 있으면 AI 툴 무료, 쿠폰 비용 반반 분담.
없으면 AI 툴 유료, 쿠폰 비용 플랫폼 전액. (→ `docs/10`)

---

## 2. `contacts/{contactId}` — 설계사 고객카드

```ts
type Tier = 'S' | 'A' | 'B' | 'C'

interface Contact {
  id: string
  ownerAgentId: string // 소유 설계사 uid. 다른 설계사는 읽을 수 없다.
  name: string
  photoURL: string | null
  company: string | null // 예: "제주중앙자동차"
  position: string | null // 예: "대표"
  phone: string | null
  email: string | null
  website: string | null
  socials: { instagram?: string; kakao?: string; naver?: string; thread?: string }
  tier: Tier
  contactCycleDays: number // 등급별 연락 주기. S=3, A=7, B=14, C=30 (기본값, 수정 가능)
  lastContactedAt: Timestamp | null
  nextContactDueAt: Timestamp | null // 서버에서 계산해 저장
  note: string | null // 특이사항. 예: "신차 출시 관심 높음"
  tags: string[]
  location: GeoPoint | null
  storeId: string | null // 사업자인 경우 연결된 store
  consent: {
    dataSharing: boolean // 플랫폼 공용 데이터로 전환 동의
    portrait: boolean // 사진 공개 동의
    recording: boolean // 상담 녹음 동의
    updatedAt: Timestamp
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null
}
```

**중요**: `consent.dataSharing !== true` 인 `contact` 의 어떤 정보도 공개 영역(피드·지도·매장페이지)에
노출해서는 안 된다. 이건 원 제안서 10장의 개인정보 리스크에 대한 최소 방어선이다.

### `contacts/{contactId}/interactions/{interactionId}`

```ts
interface Interaction {
  id: string
  contactId: string
  agentId: string
  type: 'meeting' | 'call' | 'message' | 'note' | 'voice'
  body: string | null
  audioURL: string | null // consent.recording === true 일 때만 저장 허용
  attachments: { url: string; name: string; mime: string }[]
  aiSummary: string | null // AI 요약 (docs/10). 없으면 null
  occurredAt: Timestamp
  createdAt: Timestamp
}
```

---

## 3. `stores/{storeId}` — 매장 / 랜딩페이지

이미지 `ref-01-merchant-storepage.png` 가 이 문서의 렌더링 결과다.

```ts
interface Store {
  id: string
  ownerUid: string | null // merchant 계정. 설계사가 대신 만든 경우 null 가능
  createdByAgentId: string | null
  name: string // "제주 해녀밥상"
  tagline: string // "30년 전통 해산물 전문"
  category: 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'farm' | 'retail' | 'etc'
  tier: Tier // 카드 우상단 배지
  heroImageURL: string | null
  images: string[]
  description: string // "매장 소개" 본문
  address: string // "제주시 연동 123"
  location: { lat: number; lng: number; geohash: string } | null
  businessHours: { open: string; close: string; note?: string } // "08:00" ~ "20:30"
  closedDays: number[] // 0=일 … 6=토
  phone: string | null
  socials: { instagram?: string; naver?: string; kakao?: string }
  rating: number // 0~5, 소수 1자리
  reviewCount: number
  status: 'draft' | 'published' | 'suspended'
  isPublic: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null
}
```

### `stores/{storeId}/menuItems/{itemId}`

```ts
interface MenuItem {
  id: string
  name: string // "해녀 전복뚝배기"
  price: number // 18000 (원 단위 정수. 통화 포맷은 UI에서)
  imageURL: string | null
  isSignature: boolean // "대표 메뉴" / "시그니처 메뉴" 섹션 노출
  order: number
}
```

### `stores/{storeId}/products/{productId}` — 직거래 상품

이미지 `ref-04-consumer-localhero.png` 하단 그리드가 이것.

```ts
interface Product {
  id: string
  name: string // "제주 감귤 5kg"
  subtitle: string // "새콤달콤 제주 감귤"
  price: number // 19800
  imageURL: string | null
  badge: 'best' | 'new' | 'sale' | null
  stock: number | null // null = 재고 관리 안 함
  isActive: boolean
}
```

---

## 4. `posts/{postId}` — Live Feed 게시물

```ts
interface Post {
  id: string
  authorUid: string
  authorRole: Role
  storeId: string | null
  type: 'text' | 'photo' | 'voice' | 'poster'
  body: string | null
  images: string[]
  audioURL: string | null
  aiGeneratedImageURL: string | null // AI 포스터 결과 (docs/10)
  location: { lat: number; lng: number; geohash: string } | null
  locationSource: 'exif' | 'manual' | 'store' | null
  visibility: 'public' | 'agentOnly' | 'private'
  likeCount: number
  commentCount: number
  reportCount: number
  status: 'active' | 'hidden' | 'removed'
  createdAt: Timestamp
  deletedAt: Timestamp | null
}
```

EXIF 위치 추출은 클라이언트에서 수행하고, **원본 EXIF는 저장하지 않는다** (촬영자 기기정보 유출 방지).
좌표만 뽑아 `location` 에 넣고 이미지는 EXIF 제거 후 업로드한다.

---

## 5. `anonymousPosts/{postId}` — 익명방 "아프니까 사장이다"

```ts
interface AnonymousPost {
  id: string
  authorUidHash: string // ★ 원문 uid 아님. HMAC(uid, SERVER_SALT). 운영자만 역추적 요청 가능
  authorUid: string // ★ Security Rules로 read 완전 차단. 서버(Admin SDK)만 접근
  body: string // 비식별화 처리 후 본문
  rawBodyRef: string | null // 비식별화 전 원문 보관 경로 (서버 전용, 보존기간 정책 필요)
  redactions: { type: 'store' | 'address' | 'person' | 'phone'; count: number }[]
  commentCount: number
  reportCount: number
  status: 'active' | 'hidden' | 'removed'
  createdAt: Timestamp
}
```

> **미확정**: 비식별화(마스킹) 로직을 룰 기반으로 할지 LLM으로 할지 정해지지 않았다.
> M단계에서는 **정규식 기반 최소 마스킹**(전화번호, `○○점`/`○○식당` 패턴, 도로명 주소)만 구현하고,
> LLM 비식별화는 `docs/10` 의 어댑터 인터페이스로 남긴다.

---

## 6. `listings/{listingId}` — 상가 임대·매매

```ts
interface Listing {
  id: string
  dealType: 'rent' | 'sale' // 배지: 임대 / 매매
  title: string // "제주시 노형동 상가"
  deposit: number | null // 보증금(만원)
  monthlyRent: number | null // 월세(만원)
  salePrice: number | null // 매매가(만원)
  areaPyeong: number | null // 평
  floor: string | null // "1층"
  imageURL: string | null
  location: { lat: number; lng: number; geohash: string } | null
  locationSource: 'exif' | 'manual'
  submittedByUid: string
  status: 'pending' | 'active' | 'expired' | 'removed'
  createdAt: Timestamp
}
```

금액 단위를 **만원 정수**로 통일한다. 이미지의 "보증금 3,000 / 월 150 / 25평"이 이 단위다.
UI 포맷팅은 `formatDeposit()` 유틸 하나로 통일한다.

---

## 7. `supportPrograms/{programId}` — 정부지원·대출 정보

```ts
interface SupportProgram {
  id: string
  kind: 'grant' | 'loan' | 'education' // 배지: 지원 / 대출 / 교육
  title: string // "소상공인 경영안정자금"
  maxAmount: number | null // 원 단위
  interestRate: number | null // 연 % (예: 2.0)
  summary: string
  sourceUrl: string | null // ★ 반드시 출처 링크를 함께 저장
  applyStart: Timestamp | null
  applyEnd: Timestamp | null
  isAlwaysOpen: boolean // "상시접수"
  region: string | null
  status: 'active' | 'closed'
  createdAt: Timestamp
}
```

> **주의**: 이 데이터는 금전적 판단에 쓰인다. **출처 URL 없는 레코드는 노출하지 않는다.**
> 자동 수집을 붙이더라도 원문 링크와 수집 시각을 반드시 함께 보여줘야 한다.
> UI에 "실제 조건은 해당 기관 공고를 확인하세요" 고지를 상시 표기한다.

---

## 8. `groupBuys/{groupBuyId}` — 공동구매

```ts
interface GroupBuy {
  id: string
  title: string // "식자재 공동구매 (6월 2차)"
  imageURL: string | null
  discountRate: number // 28 → "최대 28% 할인"
  participantCount: number
  targetCount: number | null
  deadline: Timestamp
  region: string
  status: 'open' | 'closed'
  createdAt: Timestamp
}
```

---

## 9. `coupons/{couponId}` · `couponIssues/{issueId}`

```ts
interface Coupon {
  id: string
  storeId: string
  title: string
  discountType: 'percent' | 'amount'
  discountValue: number
  costSharing: 'platform' | 'agentSplit' // agentId 유무로 결정 (docs/00 §4.5)
  agentId: string | null
  conditions: string | null
  validFrom: Timestamp
  validTo: Timestamp
  issuedCount: number
  usedCount: number
  status: 'active' | 'paused' | 'expired'
}

interface CouponIssue {
  id: string
  couponId: string
  userUid: string
  issuedAt: Timestamp
  usedAt: Timestamp | null
  usedByStoreStaffUid: string | null
}
```

정산은 **구현하지 않는다.** `costSharing` 은 필드로만 저장한다.

---

## 10. `reports/{reportId}` — 신고

```ts
interface Report {
  id: string
  targetType: 'post' | 'anonymousPost' | 'comment' | 'store' | 'user' | 'listing'
  targetId: string
  reporterUid: string
  reason: 'spam' | 'abuse' | 'privacy' | 'false' | 'etc'
  detail: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'rejected'
  handledByUid: string | null
  handledAt: Timestamp | null
  createdAt: Timestamp
}
```

## 11. `auditLogs/{logId}` — 어드민 감사 로그

```ts
interface AuditLog {
  id: string
  actorUid: string
  action: string // 'user.setRole' | 'post.hide' | 'anonymous.reveal' ...
  targetType: string
  targetId: string
  before: unknown | null
  after: unknown | null
  createdAt: Timestamp
}
```

어드민이 하는 모든 파괴적 작업은 여기 남긴다. 특히 익명방 작성자 역추적은 반드시 로그를 남긴다.

---

## 12. 인덱스 (필요 시 `firestore.indexes.json`)

- `contacts`: `ownerAgentId` + `tier` + `nextContactDueAt`
- `posts`: `status` + `createdAt desc`, `geohash` + `createdAt desc`
- `listings`: `status` + `dealType` + `createdAt desc`
- `stores`: `isPublic` + `category` + `rating desc`

---

## 13. Security Rules 골격 (`firestore.rules`)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function isAdmin() { return signedIn() && request.auth.token.admin == true; }
    function role() { return request.auth.token.role; }

    match /users/{userId} {
      allow read: if uid() == userId || isAdmin();
      allow create: if uid() == userId;
      // role / isAdmin 은 클라이언트가 못 바꾼다. 서버(Admin SDK)만 변경.
      allow update: if (uid() == userId
                        && !request.resource.data.diff(resource.data)
                             .affectedKeys().hasAny(['role','isAdmin','agentId']))
                      || isAdmin();
      allow delete: if isAdmin();
    }

    match /contacts/{contactId} {
      allow read, update, delete: if isAdmin()
        || (signedIn() && resource.data.ownerAgentId == uid());
      allow create: if signedIn() && role() == 'agent'
        && request.resource.data.ownerAgentId == uid();

      match /interactions/{id} {
        allow read, write: if isAdmin()
          || (signedIn()
              && get(/databases/$(database)/documents/contacts/$(contactId))
                   .data.ownerAgentId == uid());
      }
    }

    match /stores/{storeId} {
      allow read: if resource.data.isPublic == true
                  || isAdmin()
                  || (signedIn() && resource.data.ownerUid == uid());
      allow create: if signedIn() && role() in ['agent','merchant'];
      allow update, delete: if isAdmin()
        || (signedIn() && resource.data.ownerUid == uid())
        || (signedIn() && resource.data.createdByAgentId == uid());

      match /{sub=**} {
        allow read: if get(/databases/$(database)/documents/stores/$(storeId)).data.isPublic == true
                    || isAdmin();
        allow write: if isAdmin()
          || (signedIn()
              && get(/databases/$(database)/documents/stores/$(storeId)).data.ownerUid == uid());
      }
    }

    match /posts/{postId} {
      allow read: if resource.data.visibility == 'public' && resource.data.status == 'active'
                  || isAdmin()
                  || (signedIn() && resource.data.authorUid == uid());
      allow create: if signedIn() && request.resource.data.authorUid == uid();
      allow update: if isAdmin() || (signedIn() && resource.data.authorUid == uid());
      allow delete: if isAdmin();
    }

    match /anonymousPosts/{postId} {
      // authorUid 필드가 존재하므로 클라이언트 직접 read를 금지한다.
      // 읽기는 서버(Route Handler)가 Admin SDK로 필드를 걸러 내려준다.
      allow read: if false;
      allow create: if signedIn();
      allow update, delete: if false;
    }

    match /listings/{id} {
      allow read: if resource.data.status == 'active' || isAdmin();
      allow create: if signedIn();
      allow update, delete: if isAdmin()
        || (signedIn() && resource.data.submittedByUid == uid());
    }

    match /supportPrograms/{id}  { allow read: if true;  allow write: if isAdmin(); }
    match /groupBuys/{id}        { allow read: if true;  allow write: if isAdmin(); }

    match /coupons/{id}          { allow read: if true;
                                   allow write: if isAdmin()
                                     || (signedIn() && role() == 'merchant'); }
    match /couponIssues/{id} {
      allow read:   if isAdmin() || (signedIn() && resource.data.userUid == uid());
      allow create: if signedIn() && request.resource.data.userUid == uid();
      allow update: if isAdmin() || (signedIn() && role() == 'merchant');
    }

    match /reports/{id} {
      allow create: if signedIn();
      allow read, update, delete: if isAdmin();
    }

    match /auditLogs/{id} { allow read: if isAdmin(); allow write: if false; }

    match /{document=**} { allow read, write: if false; }
  }
}
```

> 이 규칙은 **초안**이다. 반드시 Firebase 에뮬레이터의 Rules 테스트로 검증한 뒤 배포한다.
> 특히 `anonymousPosts` 의 `allow read: if false` 는 앱 동작을 막을 수 있으므로,
> 서버 경유 읽기 경로(`/api/anonymous/list`)를 먼저 만들고 나서 적용한다.

## 14. Storage Rules 골격 (`storage.rules`)

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|audio/.*');
    }
    match /stores/{storeId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
    match /{allPaths=**} { allow read, write: if false; }
  }
}
```
