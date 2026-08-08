import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { PaletteSwitcher } from '@/components/theme/PaletteSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { getSession } from '@/lib/auth/session'
import { Link, redirect } from '@/lib/i18n/navigation'
import { ROLE_HOME } from '@/types/user'

/**
 * 랜딩 (docs/03 §1).
 * 로그인 상태면 역할별 홈으로 보내고, 아니면 로그인 안내를 보여준다.
 *
 * 세션을 읽으므로 정적 생성은 불가능하다. generateStaticParams 를 두지 않는다.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  if (session) {
    redirect({ href: session.role ? ROLE_HOME[session.role] : '/onboarding', locale })
  }

  const t = await getTranslations()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-display text-content">local-os</h1>
      <p className="mt-2 text-body text-content-muted">{t('auth.subtitle')}</p>

      <div className="mt-6">
        <Link
          href="/login"
          className="inline-block rounded-chip bg-accent-strong px-5 py-3 text-label text-accent-on"
        >
          {t('auth.signInWithGoogle')}
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <div className="mt-3">
        <PaletteSwitcher />
      </div>

      <Link
        href="/kitchen-sink"
        className="mt-8 inline-block text-label text-accent-strong underline"
      >
        kitchen-sink
      </Link>
    </main>
  )
}
