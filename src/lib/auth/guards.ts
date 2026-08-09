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
  // 로그인 전용 화면은 없다 — 메인 + 로그인 모달로 보낸다.
  if (!session) return redirect({ href: '/?login=1', locale })

  // 어드민은 모든 역할 화면을 열람할 수 있다 (docs/09 §1 — 화면별 보기).
  // 화면 상단에 AdminPeekBanner 가 "관리자 권한으로 보고 있습니다"를 상시 표시한다.
  // 데이터는 여전히 본인 uid 기준이라 남의 고객 목록 등이 열리지는 않는다 (docs/06 §10).
  if (session.isAdmin) return session

  const role = session.role
  if (!role) return redirect({ href: '/onboarding', locale })
  // 남의 역할 화면에 들어오면 자기 홈으로 돌려보낸다.
  if (!allowed.includes(role)) return redirect({ href: ROLE_HOME[role], locale })

  return session
}
