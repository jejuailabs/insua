'use client'

import { Mic, Pencil, Phone, Send, Sparkles, Footprints } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { TierBadge } from '@/components/ui/TierBadge'
import { addInteraction } from '@/lib/crm/actions'
import type { Contact, Interaction, InteractionType } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

const TYPE_ICON = { note: Pencil, call: Phone, visit: Footprints, voice: Mic } as const

/**
 * 상담로그 (docs/06 §7). 좌측 고객 목록(축소) + 우측 타임라인. 모바일은 단일 컬럼.
 * AI 요약은 docs/10 어댑터 — 버튼만 두고 준비 중 (실호출 없음).
 */
export function InteractionsScreen({
  contacts,
  selectedId,
  interactions,
}: {
  contacts: Contact[]
  selectedId: string | null
  interactions: Interaction[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [type, setType] = useState<InteractionType>('note')
  const [toast, setToast] = useState<string | null>(null)

  const selected = contacts.find((c) => c.id === selectedId) ?? null

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function submit() {
    if (!selected || !body.trim() || pending) return
    startTransition(async () => {
      const result = await addInteraction(selected.id, type, body)
      if (result.ok) {
        setBody('')
        showToast(t('crm.logSaved'))
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* 고객 목록 (축소형) */}
      <ul className="flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto md:w-44 md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {contacts.map((contact) => (
          <li key={contact.id} className="shrink-0">
            <button
              type="button"
              onClick={() => router.replace(`/${locale}/interactions?contactId=${contact.id}`)}
              className={cn(
                'flex w-full items-center gap-2 rounded-inner border p-2 text-left',
                contact.id === selectedId
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface',
              )}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-pill bg-surface-2">
                {contact.photoURL && (
                  <Image src={contact.photoURL} alt="" fill sizes="36px" className="object-cover" />
                )}
              </span>
              <span className="hidden min-w-0 flex-col md:flex">
                <span className="truncate text-label text-content">{contact.name}</span>
                <span className="truncate text-micro text-content-muted">{contact.company}</span>
              </span>
              <span className="text-label text-content md:hidden">{contact.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 타임라인 */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-subtitle text-content">{selected.name}</h2>
              <TierBadge tier={selected.tier} />
              <button
                type="button"
                onClick={() => showToast(t('common.comingSoon'))}
                className="ml-auto flex items-center gap-1 rounded-chip border border-line px-3 py-1.5 text-label text-content-muted"
              >
                <Sparkles size={14} aria-hidden />
                {t('crm.aiSummary')}
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-2 pb-32">
              {interactions.map((item) => {
                const Icon = TYPE_ICON[item.type]
                return (
                  <li key={item.id} className="rounded-inner border border-line bg-surface p-3">
                    <p className="flex items-center gap-1.5 text-micro text-content-muted">
                      <Icon size={12} aria-hidden />
                      {t(`crm.type${item.type[0]!.toUpperCase()}${item.type.slice(1)}`)}
                      <span className="tabular ml-auto">
                        {new Date(item.createdAt).toLocaleDateString(locale)}
                      </span>
                    </p>
                    <p className="mt-1.5 text-body text-content">{item.body}</p>
                  </li>
                )
              })}
              {interactions.length === 0 && (
                <li className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
                  {t('crm.logEmpty')}
                </li>
              )}
            </ul>

            {/* 컴포저 */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto max-w-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  {(['note', 'call', 'visit', 'voice'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={cn(
                        'rounded-chip border px-3 py-1.5 text-micro',
                        type === value
                          ? 'border-accent bg-accent-soft text-accent-strong'
                          : 'border-line text-content-muted',
                      )}
                    >
                      {t(`crm.type${value[0]!.toUpperCase()}${value.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit()
                    }}
                    placeholder={t('crm.logPlaceholder')}
                    className="min-h-11 flex-1 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!body.trim() || pending}
                    aria-label={t('common.save')}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on disabled:opacity-50"
                  >
                    <Send size={18} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
            {t('crm.logEmpty')}
          </p>
        )}
      </div>

      {toast && (
        <p
          role="status"
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </div>
  )
}
