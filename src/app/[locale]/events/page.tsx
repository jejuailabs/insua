import { Gift } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EventComposer } from '@/components/events/EventComposer'
import { EventList } from '@/components/events/EventList'
import { SideRail } from '@/components/layout/SideRail'
import { getSession } from '@/lib/auth/session'
import { listEvents, listSelectableStores } from '@/lib/events/data'

/**
 * 이벤트 (docs/08 §3 + 사용자 확정 사양) — 공개.
 * 등록은 설계사·관리자만. 매장 연계 토글로 매장 이벤트 / 광역 이벤트가 갈린다.
 */
export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  const canCreate = session?.role === 'agent' || session?.isAdmin === true
  const [t, events, stores] = await Promise.all([
    getTranslations(),
    listEvents(),
    canCreate ? listSelectableStores() : Promise.resolve([]),
  ])

  return (
    <div className="flex">
      <SideRail variant="consumer" active="events" homeHref="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10 lg:max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-display text-content">{t('nav.events')}</h1>
          {canCreate && <EventComposer stores={stores} />}
        </div>

        {events.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-10 text-center">
            <Gift size={32} aria-hidden className="text-content-faint" />
            <p className="text-body text-content-muted">{t('consumer.eventsEmpty')}</p>
          </div>
        ) : (
          <EventList events={events} signedIn={Boolean(session)} />
        )}
      </main>
    </div>
  )
}
