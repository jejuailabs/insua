// Admin SDK 는 Edge 런타임에서 동작하지 않는다 (docs/01 §2).
export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { applyBootstrapAdmin } from '@/lib/auth/bootstrapAdmin'
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from '@/lib/auth/session'
import { AdminNotConfiguredError, getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { routing } from '@/lib/i18n/routing'
import { DEFAULT_PALETTE } from '@/lib/theme/palette'

/** ID 토큰을 검증하고 HttpOnly 세션 쿠키를 발급한다 (docs/03 §2). */
export async function POST(request: Request) {
  let idToken: unknown
  try {
    ;({ idToken } = await request.json())
  } catch {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 })
  }

  if (typeof idToken !== 'string' || !idToken) {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 })
  }

  try {
    // checkRevoked: true — 폐기된 토큰으로 세션을 새로 만들 수 없게 한다.
    const decoded = await getAdminAuth().verifyIdToken(idToken, true)

    const ref = getAdminDb().collection('users').doc(decoded.uid)
    const snap = await ref.get()

    if (!snap.exists) {
      const now = new Date()
      await ref.set({
        uid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name ?? '',
        photoURL: decoded.picture ?? null,
        // 역할은 온보딩에서만 정해진다. 여기서 추측해 넣지 않는다 (docs/03 §3).
        role: null,
        isAdmin: false,
        locale: routing.defaultLocale,
        themePreference: 'system',
        palette: DEFAULT_PALETTE,
        region: null,
        agentId: null,
        onboardedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      await applyBootstrapAdmin(decoded.uid, decoded.email)
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    })

    ;(await cookies()).set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })

    return Response.json({ ok: true })
  } catch (error) {
    // 서버 설정 누락과 인증 실패는 원인이 다르다. 상태 코드를 갈라야 운영에서 구분된다.
    if (error instanceof AdminNotConfiguredError) {
      console.error('[api/session] 서버 설정 누락:', error.message)
      return Response.json({ error: 'SERVER_NOT_CONFIGURED' }, { status: 503 })
    }
    // 원문 에러는 사용자에게 노출하지 않는다. 개인정보가 섞일 수 있다 (docs/12 §5).
    console.error('[api/session] POST failed:', (error as Error).name)
    return Response.json({ error: 'SESSION_CREATE_FAILED' }, { status: 401 })
  }
}

export async function DELETE() {
  ;(await cookies()).delete(SESSION_COOKIE)
  return Response.json({ ok: true })
}
