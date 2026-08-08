import 'server-only'

import { redirect } from '@/lib/i18n/navigation'
import { getSession, type Session } from './session'
import { ROLE_HOME, type Role } from '@/types/user'

/**
 * 3중 방어의 **2층** (docs/03 §4.3). 여기가 진짜 판정이다.
 * proxy 는 쿠키가 있는지만 봤고, 그 쿠키가 유효한지·역할이 맞는지는 여기서 검증한다.
 *
 * 화면 컴포넌트에서 `if (session.role === 'agent')` 같은 클라이언트 분기로
 * 보호된 화면을 만들지 말 것 (CLAUDE.md §3-2).
 */
export async function requireRolePage(locale: string, allowed: readonly Role[]): Promise<Session> {
  const session = await getSession()

  // redirect() 는 never 를 반환하지만 구조분해로 가져온 식별자라 TS 가 흐름을 좁히지 못한다.
  // `return` 을 붙이면 never 가 반환 타입에 흡수돼 좁히기 없이도 타입이 맞는다.
  if (!session) return redirect({ href: '/login', locale })

  const role = session.role
  if (!role) return redirect({ href: '/onboarding', locale })
  // 남의 역할 화면에 들어오면 자기 홈으로 돌려보낸다.
  if (!allowed.includes(role)) return redirect({ href: ROLE_HOME[role], locale })

  return session
}
