'use client'

import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPinned,
  Mic,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { setNextContactDate } from '@/lib/crm/actions'
import { NewContactForm } from './NewContactForm'
import { PersonCard } from './PersonCard'
import { FeedPostButton } from '@/components/feed/FeedPostButton'
import { Modal } from '@/components/ui/Modal'
import { overdueDays, TIERS, type Contact, type Tier } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

type SortKey = 'due' | 'recent' | 'name' | 'tier'
const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 }

/**
 * CRM 본문 (docs/06, ref-03) — Firestore 실데이터를 서버에서 받아 렌더한다.
 * 검색·필터·정렬·단체 문자 선택 모드는 클라이언트 상태다.
 */
export function CrmScreen({ contacts }: { contacts: Contact[] }) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tierFilter, setTierFilter] = useState<Tier | null>(null)
  const [sort, setSort] = useState<SortKey>('due')
  const [sortOpen, setSortOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const counts = useMemo(() => {
    const map: Record<Tier, number> = { S: 0, A: 0, B: 0, C: 0 }
    for (const c of contacts) map[c.tier]++
    return map
  }, [contacts])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = contacts.filter((c) => {
      if (tierFilter && c.tier !== tierFilter) return false
      if (!q) return true
      return [c.name, c.company, c.phone, c.note].some((v) => v.toLowerCase().includes(q))
    })
    const by: Record<SortKey, (a: Contact, b: Contact) => number> = {
      due: (a, b) => overdueDays(b) - overdueDays(a),
      recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name, 'ko'),
      tier: (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
    }
    return [...list].sort(by[sort])
  }, [contacts, query, tierFilter, sort])

  const dueCount = contacts.filter((c) => overdueDays(c) > 0).length
  const anyRecordable = contacts.some((c) => c.consent.recording)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedContacts = contacts.filter((c) => selected.has(c.id))

  async function copySelected() {
    const text = selectedContacts.map((c) => `${c.name} ${c.phone}`).join('\n')
    await navigator.clipboard.writeText(text).catch(() => {})
    showToast(t('crm.copied'))
  }

  function downloadCsv() {
    // 발송 대행 연동은 스코프 밖 (docs/06 §3) — 대상자 목록 산출까지만.
    const rows = [['name', 'phone', 'company', 'tier']]
    for (const c of selectedContacts) rows.push([c.name, c.phone, c.company, c.tier])
    const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortLabel: Record<SortKey, string> = {
    due: t('crm.sortDue'),
    recent: t('crm.sortRecent'),
    name: t('crm.sortName'),
    tier: t('crm.sortTier'),
  }

  const actions = [
    { icon: Search, label: t('common.search'), onClick: () => setSearchOpen((v) => !v) },
    { icon: MapPinned, label: t('crm.mapView'), onClick: () => setMapOpen(true) },
    {
      icon: Mic,
      label: t('crm.recordConsult'),
      disabled: !anyRecordable,
      onClick: () =>
        showToast(anyRecordable ? t('common.comingSoon') : t('crm.recordNeedsConsent')),
    },
    { icon: Plus, label: t('crm.newContact'), onClick: () => setFormOpen(true) },
    { icon: CalendarDays, label: t('crm.calendar'), onClick: () => setCalendarOpen(true) },
  ]

  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-display text-content">{t('crm.title')}</h1>
        <span className="flex items-center gap-1">
          {/* 피드 글쓰기 — 설계사 소식이 메인 실시간 피드로 (사용자 확정 사양) */}
          <FeedPostButton />
          <span className="grid h-10 w-10 place-items-center rounded-pill text-content-muted">
            <Bell size={20} aria-hidden />
          </span>
        </span>
      </header>

      <ul className="mt-4 grid grid-cols-5 gap-2">
        {actions.map(({ icon: Icon, label, onClick, disabled }) => (
          <li key={label}>
            <button
              type="button"
              onClick={onClick}
              className={cn(
                'flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-inner border border-line bg-surface-2',
                disabled && 'opacity-45',
              )}
            >
              <Icon size={20} aria-hidden className="text-content" />
              <span className="text-micro text-content-muted">{label}</span>
            </button>
          </li>
        ))}
      </ul>

      {searchOpen && (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('crm.searchPlaceholder')}
            className="min-h-11 flex-1 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
          />
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => {
              setQuery('')
              setSearchOpen(false)
            }}
            className="grid h-10 w-10 place-items-center rounded-chip text-content-muted"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setSelecting((v) => !v)
          setSelected(new Set())
        }}
        className={cn(
          'mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-chip text-label',
          selecting ? 'bg-accent-strong text-accent-on' : 'bg-accent-soft text-accent-strong',
        )}
      >
        <Mail size={16} aria-hidden />
        {t('crm.bulkSms')}
      </button>

      {dueCount > 0 && (
        <p className="mt-3 rounded-chip border border-danger/40 bg-surface px-3 py-2 text-caption text-danger">
          {t('crm.dueSoon', { count: dueCount })}
        </p>
      )}

      <div className="mt-3 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <FilterChip
          label={t('crm.filterAll', { count: contacts.length })}
          active={tierFilter === null}
          onClick={() => setTierFilter(null)}
        />
        {TIERS.filter((tier) => counts[tier] > 0).map((tier) => (
          <FilterChip
            key={tier}
            label={t('crm.filterTier', { tier: t(`tier.${tier}`), count: counts[tier] })}
            active={tierFilter === tier}
            onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
          />
        ))}
        <div className="relative ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-0.5 text-label text-content-muted"
          >
            {sortLabel[sort]}
            <ChevronDown size={14} aria-hidden />
          </button>
          {sortOpen && (
            <ul className="absolute right-0 z-30 mt-1 w-32 overflow-hidden rounded-inner border border-line bg-surface shadow-card">
              {(Object.keys(sortLabel) as SortKey[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      setSort(key)
                      setSortOpen(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-label',
                      key === sort ? 'bg-accent-soft text-accent-strong' : 'text-content',
                    )}
                  >
                    {sortLabel[key]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 pb-24">
        {visible.map((contact) => (
          <PersonCard
            key={contact.id}
            contact={contact}
            selectable={selecting}
            selected={selected.has(contact.id)}
            onToggleSelect={() => toggleSelect(contact.id)}
            onOpenLog={() => router.push(`/${locale}/interactions?contactId=${contact.id}`)}
          />
        ))}

        {visible.length === 0 && (
          <div className="rounded-card border border-line bg-surface p-8 text-center">
            <p className="text-body text-content-muted">
              {contacts.length === 0 ? t('crm.empty.title') : t('crm.emptyFilter')}
            </p>
            <button
              type="button"
              onClick={() => {
                if (contacts.length === 0) setFormOpen(true)
                else {
                  setQuery('')
                  setTierFilter(null)
                }
              }}
              className="mt-4 min-h-11 rounded-chip bg-accent-strong px-5 text-label text-accent-on"
            >
              {contacts.length === 0 ? t('crm.empty.action') : t('crm.filterReset')}
            </button>
          </div>
        )}
      </div>

      {/* 단체 문자 선택 바 */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <span className="flex-1 text-label text-content">
              {t('crm.selectedCount', { count: selected.size })}
            </span>
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => {
                // 기기 문자앱으로 바로 — 소량 발송용. 대량 발송 대행은 API 계약 후 (docs/06 §3)
                const numbers = selectedContacts.map((c) => c.phone).filter(Boolean)
                const sep = /iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'
                window.location.href = `sms:${numbers.join(',')}${sep}body=`
              }}
              className="min-h-11 rounded-chip border border-line px-4 text-label text-content disabled:opacity-50"
            >
              {t('crm.openSmsApp')}
            </button>
            <button
              type="button"
              disabled={!selected.size}
              onClick={copySelected}
              className="min-h-11 rounded-chip bg-accent-strong px-4 text-label text-accent-on disabled:opacity-50"
            >
              {t('crm.copyList')}
            </button>
            <button
              type="button"
              disabled={!selected.size}
              onClick={downloadCsv}
              className="min-h-11 rounded-chip border border-line px-4 text-label text-content disabled:opacity-50"
            >
              {t('crm.downloadCsv')}
            </button>
          </div>
        </div>
      )}

      <NewContactForm open={formOpen} onClose={() => setFormOpen(false)} />

      <Modal open={mapOpen} onClose={() => setMapOpen(false)} title={t('crm.mapView')}>
        {/* 지도 SDK 미확정 (docs/06 §3) — MapPlaceholder */}
        <div className="grid aspect-video place-items-center rounded-inner border border-line bg-surface-2">
          <p className="max-w-60 text-center text-caption text-content-muted">
            {t('crm.mapPreparing')}
          </p>
        </div>
      </Modal>

      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title={t('crm.calendarTitle')}
      >
        <CalendarMonth contacts={contacts} />
      </Modal>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-chip border px-3 py-1.5 text-label',
        active
          ? 'border-accent bg-accent-soft text-accent-strong'
          : 'border-line bg-surface text-content-muted',
      )}
    >
      {label}
    </button>
  )
}

/**
 * 연락 예정일 월간 뷰 (docs/06 §3).
 * **날짜를 누르면 일정 등록** (사용자 확정 사양) — 고객을 골라 그 날짜로 연락 예정일을 잡는다.
 */
export function CalendarMonth({ contacts }: { contacts: Contact[] }) {
  const t = useTranslations('crm')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [base, setBase] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  function assign(contactId: string) {
    if (selectedDay === null || pending) return
    const date = new Date(base.getFullYear(), base.getMonth(), selectedDay, 9, 0, 0)
    startTransition(async () => {
      const result = await setNextContactDate(contactId, date.toISOString())
      if (result.ok) {
        setToast(t('dueSet'))
        setTimeout(() => setToast(null), 2000)
        setSelectedDay(null)
        router.refresh()
      }
    })
  }

  const year = base.getFullYear()
  const month = base.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()

  // 고객 수가 수백 단위라 매 렌더 계산해도 충분히 싸다. 메모이제이션은 컴파일러에 맡긴다.
  const dueByDay: Record<number, number> = {}
  for (const c of contacts) {
    if (!c.nextContactDueAt) continue
    const d = new Date(c.nextContactDueAt)
    if (d.getFullYear() === year && d.getMonth() === month) {
      dueByDay[d.getDate()] = (dueByDay[d.getDate()] ?? 0) + 1
    }
  }

  const today = new Date()
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setBase(new Date(year, month - 1, 1))}
          className="grid h-9 w-9 place-items-center rounded-chip text-content-muted"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <p className="tabular text-subtitle text-content">
          {year}. {String(month + 1).padStart(2, '0')}
        </p>
        <button
          type="button"
          onClick={() => setBase(new Date(year, month + 1, 1))}
          className="grid h-9 w-9 place-items-center rounded-chip text-content-muted"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="tabular mt-3 grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1
          const due = dueByDay[day]
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={cn(
                'flex min-h-11 flex-col items-center gap-0.5 rounded-chip py-1 text-caption',
                selectedDay === day
                  ? 'bg-accent-strong text-accent-on'
                  : isThisMonth && today.getDate() === day
                    ? 'bg-accent-soft text-accent-strong'
                    : 'text-content hover:bg-surface-2',
              )}
            >
              {day}
              {due && (
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-pill bg-danger" />
                  <span
                    className={cn(
                      'text-micro',
                      selectedDay === day ? 'text-accent-on' : 'text-content-muted',
                    )}
                  >
                    {due}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 날짜 선택 → 고객 지정 (사용자 확정 사양) */}
      {selectedDay !== null && (
        <div className="mt-3 rounded-inner border border-line bg-surface-2 p-3">
          <p className="text-label text-content">
            {t('assignDue')} — {base.getFullYear()}.{String(base.getMonth() + 1).padStart(2, '0')}.
            {String(selectedDay).padStart(2, '0')}
          </p>
          <p className="mt-0.5 text-micro text-content-muted">{t('pickContact')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                disabled={pending}
                onClick={() => assign(contact.id)}
                className="rounded-chip border border-line bg-surface px-2.5 py-1.5 text-label text-content hover:border-accent disabled:opacity-50"
              >
                {contact.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </div>
  )
}
