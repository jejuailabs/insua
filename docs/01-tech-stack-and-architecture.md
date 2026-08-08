# 01. 기술 스택 · 아키텍처

## 1. 스택

| 영역          | 선택                                                | 확정도     |
| ------------- | --------------------------------------------------- | ---------- |
| 프레임워크    | Next.js **App Router** + TypeScript (strict)        | 확정       |
| 패키지 매니저 | pnpm                                                | 확정       |
| 배포          | Vercel                                              | 확정       |
| 스타일        | Tailwind CSS + CSS 변수 토큰                        | 확정       |
| UI 프리미티브 | Radix UI (필요한 것만 개별 설치)                    | 권장       |
| 아이콘        | lucide-react                                        | 확정       |
| 인증          | Firebase Authentication — Google Provider           | 확정       |
| DB            | Cloud Firestore                                     | 확정       |
| 스토리지      | Firebase Storage                                    | 확정       |
| 서버 권한     | firebase-admin (Route Handler / Server Action 전용) | 확정       |
| 테마          | next-themes                                         | 확정       |
| 다국어        | next-intl                                           | 확정       |
| 폼            | react-hook-form + zod                               | 권장       |
| 지도          | 미확정 — `docs/12` 참조                             | **미확정** |

> **버전 고정 규칙**: 각 패키지 버전은 설치 시점에 `pnpm add <pkg>` 로 최신 안정판을 받고,
> `package.json` 에 정확한 버전을 기록한다. 이 문서에 버전을 적어두지 않는 이유는
> 문서 작성 시점 이후 릴리스가 계속 나오기 때문이다. **버전을 추측해서 쓰지 말 것.**

> **지도 관련 미확정 사항**: 국내 서비스이므로 카카오맵 / 네이버 지도 / Google Maps 중
> 선택이 필요하다. 각각 이용약관·과금·좌표계가 다르므로 임의로 고르지 말고 물어볼 것.
> M0~M4 단계에서는 지도 자리에 **정적 플레이스홀더 컴포넌트**(`<MapPlaceholder />`)를 쓴다.

## 2. Vercel + Firebase 조합에 대한 주의

- **Firebase Hosting은 쓰지 않는다.** 호스팅은 Vercel, Firebase는 Auth/Firestore/Storage만.
- Cloud Functions는 이번 범위에서 쓰지 않는다. 서버 로직은 **Next.js Route Handler / Server Action** 으로 처리한다.
  (Functions는 Blaze 요금제가 필요하고 배포 경로가 이원화되어 관리 비용이 커진다.)
- 서버에서 Firebase Admin SDK를 쓸 때 **Node.js 런타임**을 명시한다. Edge 런타임에서는 동작하지 않는다.

```ts
// app/api/**/route.ts
export const runtime = 'nodejs'
```

## 3. 폴더 구조

```
.
├─ CLAUDE.md
├─ docs/
├─ messages/                     # 다국어 번역 (docs/05)
│   ├─ ko.json
│   ├─ en.json
│   ├─ zh.json
│   └─ ja.json
├─ src/
│   ├─ app/
│   │   ├─ [locale]/
│   │   │   ├─ layout.tsx        # ThemeProvider + NextIntlClientProvider
│   │   │   ├─ page.tsx          # 랜딩 / 역할별 리다이렉트
│   │   │   ├─ (auth)/
│   │   │   │   ├─ login/
│   │   │   │   └─ onboarding/   # 역할 선택 (docs/03)
│   │   │   ├─ (agent)/
│   │   │   │   ├─ crm/          # docs/06
│   │   │   │   ├─ interactions/
│   │   │   │   ├─ schedule/
│   │   │   │   ├─ messages/
│   │   │   │   └─ stats/
│   │   │   ├─ (merchant)/
│   │   │   │   ├─ home/         # 커뮤니티 대시보드 docs/07
│   │   │   │   ├─ store/        # 내 매장 (편집)
│   │   │   │   ├─ anonymous/
│   │   │   │   ├─ listings/
│   │   │   │   ├─ support/
│   │   │   │   ├─ groupbuy/
│   │   │   │   └─ ai-tools/     # docs/10
│   │   │   ├─ (consumer)/
│   │   │   │   ├─ feed/         # LOCAL HERO docs/08
│   │   │   │   ├─ market/
│   │   │   │   ├─ events/
│   │   │   │   └─ saved/
│   │   │   ├─ s/[storeId]/      # 공개 매장 페이지 (비로그인 접근 가능)
│   │   │   └─ admin/            # docs/09
│   │   └─ api/
│   │       ├─ session/          # 세션 쿠키 발급/삭제
│   │       └─ admin/            # 서버 전용 관리 API
│   ├─ components/
│   │   ├─ ui/                   # 프리미티브 (Button, Card, Badge, Sheet...)
│   │   ├─ layout/               # AppShell, SideRail, BottomNav, TopBar
│   │   ├─ theme/                # ThemeToggle, PaletteSwitcher
│   │   ├─ crm/
│   │   ├─ merchant/
│   │   ├─ consumer/
│   │   └─ admin/
│   ├─ lib/
│   │   ├─ firebase/
│   │   │   ├─ client.ts         # 브라우저 SDK 초기화
│   │   │   ├─ admin.ts          # server-only Admin SDK
│   │   │   └─ converters.ts     # Firestore ↔ 타입 변환
│   │   ├─ auth/                 # 세션, 역할 가드
│   │   ├─ i18n/                 # next-intl 설정
│   │   ├─ mock/                 # 개발용 시드 데이터
│   │   └─ utils/
│   ├─ types/                    # 도메인 타입 (docs/02와 1:1)
│   └─ styles/
│       ├─ globals.css
│       └─ tokens.css            # docs/04의 CSS 변수
├─ firestore.rules
├─ storage.rules
├─ firebase.json                 # 에뮬레이터 설정용
└─ .env.local.example
```

## 4. 환경변수

`.env.local.example` 에 아래를 만들고, 실제 값은 `.env.local` (gitignore).

```bash
# --- 클라이언트 노출 O (Firebase Web SDK 설정값) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- 서버 전용 (절대 NEXT_PUBLIC_ 붙이지 말 것) ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=            # 줄바꿈은 \n 로 이스케이프

# --- 운영 ---
ADMIN_BOOTSTRAP_EMAILS=          # 콤마 구분. 최초 관리자 지정용 (docs/03)
NEXT_PUBLIC_DEFAULT_LOCALE=ko
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `NEXT_PUBLIC_FIREBASE_API_KEY` 는 **비밀값이 아니다.** Firebase Web API 키는 공개 식별자이며,
> 실제 보호는 Security Rules와 승인된 도메인 설정으로 한다. 반대로 `FIREBASE_PRIVATE_KEY` 는
> 노출되면 전체 DB가 뚫린다. 이 둘을 혼동하지 말 것.

Vercel 배포 시 위 값을 Project Settings → Environment Variables에 동일하게 등록한다.
`FIREBASE_PRIVATE_KEY` 는 개행 처리 때문에 코드에서 아래처럼 복원한다.

```ts
privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
```

## 5. 렌더링 전략

| 화면                            | 전략                                            | 이유                        |
| ------------------------------- | ----------------------------------------------- | --------------------------- |
| 공개 매장 페이지 `/s/[storeId]` | 서버 컴포넌트 + ISR                             | SEO 필요, 콘텐츠 갱신 잦음  |
| 소비자 피드                     | 서버 컴포넌트 초기 로드 + 클라이언트 무한스크롤 | 위치 필터가 클라이언트 의존 |
| 설계사 CRM                      | 클라이언트 (Firestore 실시간 구독)              | 개인 데이터, 실시간성       |
| 어드민                          | 서버 컴포넌트 + Admin SDK                       | 권한 격리                   |

## 6. Firebase 클라이언트 초기화 패턴

```ts
// src/lib/firebase/client.ts
import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

export const app = getApps().length ? getApps()[0] : initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

```ts
// src/lib/firebase/admin.ts
import 'server-only'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    })

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
```

`server-only` 패키지를 반드시 import 할 것. 클라이언트 번들에 섞이면 빌드가 실패하게 만드는 안전장치다.

## 7. 로컬 에뮬레이터

```json
// firebase.json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  },
  "firestore": { "rules": "firestore.rules" },
  "storage": { "rules": "storage.rules" }
}
```

`NEXT_PUBLIC_USE_EMULATOR=true` 일 때만 `connectAuthEmulator` 등을 호출한다.

## 8. 성능 가드레일

- 모든 이미지는 `next/image`. 원격 도메인은 `next.config` 의 `remotePatterns` 에 Firebase Storage 도메인만 허용.
- Firestore 쿼리는 항상 `limit()` 을 건다. 무제한 구독 금지.
- 카드 리스트는 20개 페이지네이션 기본.
