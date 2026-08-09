import { Gift } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SideRail } from '@/components/layout/SideRail'

/** 이벤트 (docs/08 §3) — 공개. 실데이터 전이라 빈 상태만. */
export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="flex">
      <SideRail variant="consumer" active="events" homeHref="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10 lg:max-w-xl">
        <h1 className="text-display text-content">{t('nav.events')}</h1>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-10 text-center">
          <Gift size={32} aria-hidden className="text-content-faint" />
          <p className="text-body text-content-muted">{t('consumer.eventsEmpty')}</p>
        </div>
      </main>
    </div>
  )
}
