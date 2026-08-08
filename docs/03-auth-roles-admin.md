# 03. 인증 · 역할 · 어드민 모드

## 1. 전체 플로우

```
방문
 └─ 비로그인 → 공개 매장페이지 /s/[storeId], 공개 피드 일부만 열람 가능
 └─ [Google로 계속하기]
      ↓ Firebase signInWithPopup(GoogleAuthProvider)
      ↓ ID 토큰 → POST /api/session → __session 쿠키(HttpOnly) 발급
      ↓
   users/{uid} 존재?
      ├─ 없음 → 문서 생성 (role: null) → /onboarding
      └─ 있음 & role === null → /onboarding
      └─ 있음 & role !== null → 역할별 홈으로 리다이렉트
             agent    → /[locale]/crm
             merchant → /[locale]/home
             consumer → /[locale]/feed
      └─ isAdmin === true → 상단에 "관리자 모드" 진입 버튼 노출
```

## 2. Google 로그인 구현

```ts
// src/lib/auth/signIn.ts
'use client'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  const idToken = await cred.user.getIdToken()

  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('SESSION_CREATE_FAILED')
  return cred.user
}
```

모바일 웹뷰에서 팝업이 차단될 수 있으므로, 팝업 실패(`auth/popup-blocked`,
`auth/operation-not-supported-in-this-environment`) 시 `signInWithRedirect` 로 폴백한다.

### 세션 쿠키

```ts
// src/app/api/session/route.ts
export const runtime = 'nodejs'

import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

const FIVE_DAYS = 60 * 60 * 24 * 5 * 1000

export async function POST(req: Request) {
  const { idToken } = await req.json()
  const decoded = await adminAuth.verifyIdToken(idToken)

  // 최초 로그인이면 users 문서 생성
  const ref = adminDb.collection('users').doc(decoded.uid)
  const snap = await ref.get()
  if (!snap.exists) {
    await ref.set({
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: decoded.name ?? '',
      photoURL: decoded.picture ?? null,
      role: null,
      isAdmin: false,
      locale: 'ko',
      themePreference: 'system',
      palette: 'jeju-night',
      agentId: null,
      onboardedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
    await applyBootstrapAdmin(decoded.uid, decoded.email) // 아래 §4
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS })
  ;(await cookies()).set('__session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: FIVE_DAYS / 1000,
  })
  return Response.json({ ok: true })
}

export async function DELETE() {
  ;(await cookies()).delete('__session')
  return Response.json({ ok: true })
}
```

> `cookies()` 의 await 여부는 사용하는 Next.js 버전에 따라 다르다. 설치 후 실제 타입에 맞춰 조정할 것.

## 3. 역할 온보딩

`/[locale]/onboarding` — 카드 3장 중 하나를 고른다.

| 카드     | 문구(ko)                                      | 선택 후                                           |
| -------- | --------------------------------------------- | ------------------------------------------------- |
| 설계사   | "고객을 관리합니다" / 보험설계사·영업직       | `role: 'agent'` → `/crm`                          |
| 소상공인 | "가게를 운영합니다" / 음식점·카페·농장·미용실 | `role: 'merchant'` → 매장 기본정보 입력 → `/home` |
| 소비자   | "동네 소식이 궁금합니다" / 주민·관광객        | `role: 'consumer'` → 관심 반경 선택 → `/feed`     |

**역할은 클라이언트가 직접 쓰지 않는다.** 반드시 서버 액션을 거친다.

```ts
// src/app/[locale]/(auth)/onboarding/actions.ts
'use server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { requireSession } from '@/lib/auth/session'

export async function setRole(role: 'agent' | 'merchant' | 'consumer') {
  const { uid } = await requireSession()
  const ref = adminDb.collection('users').doc(uid)
  const snap = await ref.get()
  if (snap.data()?.role) throw new Error('ROLE_ALREADY_SET') // 임의 변경 차단

  await ref.update({ role, onboardedAt: new Date(), updatedAt: new Date() })
  await adminAuth.setCustomUserClaims(uid, {
    ...(await adminAuth.getUser(uid)).customClaims,
    role,
  })
}
```

역할 변경은 **어드민만** 가능하다 (`docs/09`). 사용자가 스스로 바꾸면 CRM 데이터 소유권이 꼬인다.

> 커스텀 클레임을 바꾸면 기존 ID 토큰에는 반영되지 않는다.
> 클레임 변경 후에는 클라이언트에서 `getIdToken(true)` 로 강제 갱신하고 세션 쿠키를 재발급해야 한다.

## 4. 어드민 모드

### 4.1 판정 기준 — 커스텀 클레임 `admin: true`

Firestore의 `users.isAdmin` 은 **화면 표시용 미러일 뿐**이고, 권한 판정은 항상 토큰 클레임으로 한다.

```ts
// src/lib/auth/session.ts
import 'server-only'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

export async function getSession() {
  const cookie = (await cookies()).get('__session')?.value
  if (!cookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: (decoded.role ?? null) as Role | null,
      isAdmin: decoded.admin === true,
    }
  } catch {
    return null
  }
}

export async function requireSession() {
  const s = await getSession()
  if (!s) throw new Error('UNAUTHENTICATED')
  return s
}

export async function requireAdmin() {
  const s = await requireSession()
  if (!s.isAdmin) throw new Error('FORBIDDEN')
  return s
}
```

### 4.2 최초 관리자 부트스트랩

관리자를 만들 방법이 없으면 시작을 못 하므로, 환경변수 화이트리스트로 최초 1회만 승격한다.

```ts
// 로그인 시 1회 실행
async function applyBootstrapAdmin(uid: string, email?: string) {
  const allow = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!email || !allow.includes(email.toLowerCase())) return

  await adminAuth.setCustomUserClaims(uid, {
    ...(await adminAuth.getUser(uid)).customClaims,
    admin: true,
  })
  await adminDb.collection('users').doc(uid).update({ isAdmin: true })
}
```

이후 추가 관리자는 어드민 콘솔에서 지정한다. `ADMIN_BOOTSTRAP_EMAILS` 는 운영 배포 후 비우는 것을 권장.

### 4.3 라우트 보호 — 3중 방어

1. **middleware** — `/admin/*` 요청에 `__session` 쿠키가 없으면 로그인으로 리다이렉트
   (middleware는 Edge에서 돌아 Admin SDK를 못 쓴다. **쿠키 존재 여부만** 확인하고, 실제 검증은 아래 2에서.)
2. **레이아웃 서버 컴포넌트** — `app/[locale]/admin/layout.tsx` 에서 `requireAdmin()` 호출. 실패 시 `notFound()`.
3. **Security Rules** — `request.auth.token.admin == true`

```tsx
// src/app/[locale]/admin/layout.tsx
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s?.isAdmin) notFound() // 403 대신 404 — 관리자 경로의 존재 자체를 숨긴다
  return <AdminShell>{children}</AdminShell>
}
```

### 4.4 어드민 모드 진입 UI

관리자에게만 앱 헤더 우측에 방패 아이콘 버튼이 보인다. 누르면 `/admin` 으로 이동하고,
어드민 셸은 **경고색 상단 바(4px, `--danger`)** 를 상시 표시해 일반 화면과 시각적으로 구분한다.
"지금 관리자 권한으로 보고 있다"는 사실이 항상 눈에 보여야 한다.

## 5. 미들웨어 (i18n과 합쳐짐)

```ts
// src/middleware.ts
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/lib/i18n/routing'

const intl = createIntlMiddleware(routing)

const PROTECTED = ['/crm', '/home', '/store', '/feed', '/admin', '/onboarding']

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = PROTECTED.some((p) => pathname.includes(p))

  if (needsAuth && !req.cookies.get('__session')) {
    const url = req.nextUrl.clone()
    url.pathname = `/${routing.defaultLocale}/login`
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  return intl(req)
}

export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] }
```

## 6. 로그아웃

```ts
await fetch('/api/session', { method: 'DELETE' })
await signOut(auth)
router.replace(`/${locale}`)
```

## 7. 에러 문구 (i18n 키)

| 상황        | 키                           | ko                                                                        |
| ----------- | ---------------------------- | ------------------------------------------------------------------------- |
| 팝업 차단   | `auth.error.popupBlocked`    | 팝업이 차단됐습니다. 다시 시도하면 새 창 대신 페이지 이동으로 진행합니다. |
| 네트워크    | `auth.error.network`         | 연결이 끊겼습니다. 네트워크를 확인하고 다시 시도하세요.                   |
| 권한 없음   | `auth.error.forbidden`       | 이 화면에 접근할 권한이 없습니다.                                         |
| 역할 미선택 | `auth.error.needsOnboarding` | 먼저 어떤 용도로 쓸지 선택해 주세요.                                      |

에러는 사과하지 않고, 무엇이 일어났고 어떻게 하면 되는지만 말한다.
