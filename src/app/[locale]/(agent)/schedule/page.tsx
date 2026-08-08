import { getTranslations, setRequestLocale } from 'next-intl/server'
import { agentRail } from '@/components/crm/agentRail'
import { CalendarMonth } from '@/components/crm/CrmScreen'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { listContacts } from '@/lib/crm/data'

/** 일정 — 연락 예정일 월간 뷰 (docs/06 §3 캘린더와 같은 컴포넌트). */
export default async function SchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['agent'])

  const contacts = await listContacts(session.uid)
  const t = await getTranslations()

  return (
    <div className="flex">
      <SideRail items={agentRail('schedule')} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <h1 className="text-display text-content">{t('nav.schedule')}</h1>
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <CalendarMonth contacts={contacts} />
        </div>
      </main>
    </div>
  )
}
