import { setRequestLocale } from 'next-intl/server'
import { getSession } from '@/lib/auth/session'
import { redirect } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'
import { ROLE_HOME } from '@/types/user'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * 로그인 전용 화면은 없다 (사용자 확정 사양) — 메인 + 로그인 **모달**로 보낸다.
 * 북마크·구형 링크 호환용 리다이렉트만 남긴다.
 */
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  if (session) {
    if (session.isAdmin && !session.role) return redirect({ href: '/admin', locale })
    return redirect({ href: session.role ? ROLE_HOME[session.role] : '/', locale })
  }
  return redirect({ href: '/?login=1', locale })
}
