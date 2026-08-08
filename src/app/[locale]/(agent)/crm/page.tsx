import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  FileText,
  Home,
  Mail,
  MapPinned,
  Mic,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PersonCard } from '@/components/crm/PersonCard'
import { SideRail, type RailItem } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { CONTACTS, tierCounts } from '@/lib/mock/crm'
import { cn } from '@/lib/utils/cn'

/** 설계사 CRM (docs/06, ref-03). 목데이터 단계 — 실데이터·폼은 M4 후반. */
export default async function CrmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['agent'])

  const t = await getTranslations()
  const counts = tierCounts(CONTACTS)
  const dueCount = CONTACTS.filter((c) => (c.overdueDays ?? 0) > 0).length

  const rail: RailItem[] = [
    { icon: Home, labelKey: 'nav.home', href: '/crm', stub: true },
    { icon: Users, labelKey: 'nav.crm', href: '/crm', active: true },
    { icon: FileText, labelKey: 'nav.interactions', href: '/crm', stub: true },
    { icon: CalendarCheck, labelKey: 'nav.schedule', href: '/crm', stub: true },
    { icon: Mail, labelKey: 'nav.messages', href: '/crm', stub: true },
    { icon: BarChart3, labelKey: 'nav.stats', href: '/crm', stub: true },
    { icon: Settings, labelKey: 'nav.settings', href: '/crm', stub: true },
  ]

  const actions = [
    { icon: Search, label: t('common.search') },
    { icon: MapPinned, label: t('crm.mapView') },
    { icon: Mic, label: t('crm.recordConsult') },
    { icon: Plus, label: t('crm.newContact') },
    { icon: CalendarDays, label: t('crm.calendar') },
  ]

  const chips: Array<{ key: string; label: string; active?: boolean }> = [
    { key: 'all', label: t('crm.filterAll', { count: CONTACTS.length }), active: true },
    ...(['S', 'A', 'B', 'C'] as const)
      .filter((tier) => counts[tier] > 0)
      .map((tier) => ({
        key: tier,
        label: t('crm.filterTier', { tier: t(`tier.${tier}`), count: counts[tier] }),
      })),
  ]

  return (
    <div className="flex">
      <SideRail items={rail} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <header className="flex items-center justify-between">
          <h1 className="text-display text-content">{t('crm.title')}</h1>
          <span className="grid h-10 w-10 place-items-center rounded-pill text-content-muted">
            <Bell size={20} aria-hidden />
          </span>
        </header>

        {/* 액션 5칸 (docs/06 §3) */}
        <ul className="mt-4 grid grid-cols-5 gap-2">
          {actions.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-inner border border-line bg-surface-2"
            >
              <Icon size={20} aria-hidden className="text-content" />
              <span className="text-micro text-content-muted">{label}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-chip bg-accent-soft text-label text-accent-strong"
        >
          <Mail size={16} aria-hidden />
          {t('crm.bulkSms')}
        </button>

        {/* 연락 임박 배너 — 등급별 연락 주기의 가시적 산출물 (docs/06 §5) */}
        {dueCount > 0 && (
          <p className="mt-3 rounded-chip border border-danger/40 bg-surface px-3 py-2 text-caption text-danger">
            {t('crm.dueSoon', { count: dueCount })}
          </p>
        )}

        {/* 필터칩 + 정렬 (docs/06 §4) */}
        <div className="mt-3 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={cn(
                'shrink-0 rounded-chip border px-3 py-1.5 text-label',
                chip.active
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-line bg-surface text-content-muted',
              )}
            >
              {chip.label}
            </span>
          ))}
          <span className="ml-auto flex shrink-0 items-center gap-0.5 text-label text-content-muted">
            {t('crm.sortDue')}
            <ChevronDown size={14} aria-hidden />
          </span>
        </div>

        {/* 고객카드 — 연락 임박순 (docs/06 §4 기본 정렬) */}
        <div className="mt-4 flex flex-col gap-3 pb-10">
          {[...CONTACTS]
            .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))
            .map((contact) => (
              <PersonCard key={contact.id} contact={contact} />
            ))}
        </div>
      </main>
    </div>
  )
}
