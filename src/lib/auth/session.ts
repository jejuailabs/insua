import 'server-only'

import { cookies } from 'next/headers'
import { AdminNotConfiguredError, getAdminAuth } from '@/lib/firebase/admin'
import type { Role } from '@/types/user'

export { SESSION_COOKIE, SESSION_MAX_AGE_MS } from './session.shared'
import { SESSION_COOKIE } from './session.shared'

export type Session = {
  uid: string
  email: string | null
  role: Role | null
  isAdmin: boolean
}

/**
 * docs/03 §4.1.
 * **권한 판정의 단일 출처.** Firestore 의 users.isAdmin 은 표시용 미러일 뿐이고,
 * 판정은 항상 토큰 클레임으로 한다.
 */
export async function getSession(): Promise<Session | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value
  if (!cookie) return null

  try {
    // checkRevoked: true — 계정 정지·강제 로그아웃이 즉시 반영되게 한다.
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: (decoded.role as Role | undefined) ?? null,
      isAdmin: decoded.admin === true,
    }
  } catch (error) {
    // 서버 설정 누락은 사용자 잘못이 아니다. 조용히 넘기면 원인 못 찾으니 크게 남긴다.
    // 세션 없음으로 떨어뜨리는 건 fail-safe 다 — 권한이 늘어나는 방향이 아니라 줄어드는 방향이다.
    if (error instanceof AdminNotConfiguredError) {
      console.error('[auth] Firebase Admin 환경변수가 없어 세션을 검증할 수 없다:', error.message)
      return null
    }
    // 만료·위조·폐기 전부 여기로 온다. 원문 에러는 사용자에게 보여주지 않는다 (docs/12 §5).
    return null
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHENTICATED')
  return session
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession()
  if (!session.isAdmin) throw new Error('FORBIDDEN')
  return session
}
