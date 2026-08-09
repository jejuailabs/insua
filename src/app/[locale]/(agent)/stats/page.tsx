import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { countMonthlyInteractions, listContacts } from '@/lib/crm/data'
import { overdueDays, TIERS } from '@/lib/crm/types'

/** 통계 (docs/06 §8) — 최소 구성. 도넛은 conic-gradient, 막대는 폭 비율. */
export default async function StatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['agent'])

  const contacts = await listContacts(session.uid)
  const monthly = await countMonthlyInteractions(session.uid, contacts)
  const t = await getTranslations()

  const counts = TIERS.map((tier) => ({
    tier,
    count: contacts.filter((c) => c.tier === tier).length,
  }))
  const total = contacts.length
  const overdue = contacts.filter((c) => overdueDays(c) > 0).length

  // conic-gradient 조각 계산 — 색은 토큰만 쓴다 (CLAUDE.md §3-4).
  const nonZero = counts.filter((c) => c.count > 0)
  const slices = nonZero.map(({ tier }, i) => {
    const before = nonZero.slice(0, i).reduce((sum, c) => sum + c.count, 0)
    const from = (before / Math.max(total, 1)) * 360
    const to = ((before + nonZero[i]!.count) / Math.max(total, 1)) * 360
    return `var(--tier-${tier.toLowerCase()}) ${from}deg ${to}deg`
  })

  const monthlyTotal = Object.values(monthly).reduce((a, b) => a + b, 0)
  const typeLabel = {
    note: 'typeNote',
    call: 'typeCall',
    visit: 'typeVisit',
    voice: 'typeVoice',
  } as const

  return (
    <div className="flex">
      <SideRail variant="agent" active="stats" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 pb-10">
        <AdminPeekBanner />
        <h1 className="text-display text-content">{t('crm.stats.title')}</h1>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="text-label text-content-muted">{t('crm.stats.tierDist')}</h2>
            <div className="mt-3 flex items-center gap-4">
              <div
                aria-hidden
                className="h-24 w-24 shrink-0 rounded-pill"
                style={{
                  background: slices.length
                    ? `conic-gradient(${slices.join(', ')})`
                    : 'var(--surface-2)',
                }}
              />
              <ul className="flex flex-col gap-1">
                {counts.map(({ tier, count }) => (
                  <li key={tier} className="flex items-center gap-1.5 text-caption text-content">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-pill"
                      style={{ background: `var(--tier-${tier.toLowerCase()})` }}
                    />
                    {t(`tier.${tier}`)}
                    <span className="tabular text-content-muted">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="tabular mt-2 text-caption text-content-muted">
              {t('crm.stats.total')} {total}
            </p>
          </section>

          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="text-label text-content-muted">{t('crm.stats.overdueCount')}</h2>
            <p className="tabular mt-3 text-display text-danger">{overdue}</p>
            <p className="mt-1 text-caption text-content-muted">
              {t('crm.dueSoon', { count: overdue })}
            </p>
          </section>
        </div>

        <section className="mt-3 rounded-card border border-line bg-surface p-4">
          <h2 className="text-label text-content-muted">{t('crm.stats.monthlyContacts')}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(Object.keys(typeLabel) as Array<keyof typeof typeLabel>).map((type) => (
              <li key={type} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-caption text-content">
                  {t(`crm.${typeLabel[type]}`)}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-pill bg-surface-2">
                  <span
                    className="block h-full rounded-pill bg-accent"
                    style={{
                      width: `${monthlyTotal ? (monthly[type] / monthlyTotal) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="tabular w-6 shrink-0 text-right text-caption text-content-muted">
                  {monthly[type]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
