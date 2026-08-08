import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getSession } from '@/lib/auth/session'
import { redirect } from '@/lib/i18n/navigation'
import { ROLE_HOME } from '@/types/user'
import { RoleCards } from './RoleCards'

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  if (!session) redirect({ href: '/login', locale })
  // 이미 역할이 있으면 다시 고르게 하지 않는다. 서버에서 막는 게 요점이다 (docs/03 §3).
  else if (session.role) redirect({ href: ROLE_HOME[session.role], locale })

  const t = await getTranslations('onboarding')

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-title text-content">{t('title')}</h1>
      <p className="mt-2 text-caption text-content-muted">{t('subtitle')}</p>
      <RoleCards locale={locale} />
    </main>
  )
}
