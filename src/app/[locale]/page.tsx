import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { PaletteSwitcher } from '@/components/theme/PaletteSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Link } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * 임시 랜딩. M2 에서 로그인 상태·역할에 따른 리다이렉트로 바뀐다 (docs/03 §1).
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('theme')

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-display text-content">local-os</h1>
      <p className="mt-1 text-caption text-content-muted">M1 — theme + i18n</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-micro text-content-muted uppercase">{t('palette')}</h2>
        <PaletteSwitcher />
      </div>

      <Link href="/kitchen-sink" className="mt-8 inline-block text-label text-accent underline">
        kitchen-sink
      </Link>
    </main>
  )
}
