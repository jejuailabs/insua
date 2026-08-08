import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/types/user'
import { SignInButton } from './SignInButton'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // 이미 로그인돼 있으면 로그인 화면을 보여줄 이유가 없다.
  const session = await getSession()
  if (session) {
    redirect({ href: session.role ? ROLE_HOME[session.role] : '/onboarding', locale })
  }

  const t = await getTranslations('auth')
  const { next } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-display text-content">{t('title')}</h1>
      <p className="mt-2 text-body text-content-muted">{t('subtitle')}</p>
      <div className="mt-8">
        {/* next 는 서버에서 정규화한다. 외부 도메인으로 튕기는 오픈 리다이렉트를 막는다. */}
        <SignInButton next={safeNext(next, locale)} />
      </div>
    </main>
  )
}

/**
 * 로그인 후 돌아갈 경로.
 * `//evil.com` `https://evil.com` 같은 값이 들어와도 우리 사이트 안에만 머물게 한다.
 */
function safeNext(next: string | undefined, locale: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return `/${locale}`
  return next
}
