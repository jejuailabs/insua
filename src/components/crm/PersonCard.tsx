'use client'

// 이 lucide 버전에는 브랜드 아이콘(Instagram)이 없다. 인스타는 Camera 로 대신한다.
import { Camera, Globe, MessageCircle, Pencil, Phone, RefreshCw, Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { TierBadge } from '@/components/ui/TierBadge'
import { generateHeroForContact } from '@/lib/crm/actions'
import { regenerateStoreSeo } from '@/lib/stores/seoActions'
import { overdueDays, type Contact, type Tier } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

/** 등급색 테두리 + 다크에서 발광 (docs/06 §5). */
const TIER_BORDER: Record<Tier, string> = {
  S: 'border-tier-s dark:shadow-[0_0_12px_var(--tier-s)]',
  A: 'border-tier-a dark:shadow-[0_0_12px_var(--tier-a)]',
  B: 'border-tier-b dark:shadow-[0_0_12px_var(--tier-b)]',
  C: 'border-tier-c dark:shadow-[0_0_12px_var(--tier-c)]',
}

const TIER_TEXT: Record<Tier, string> = {
  S: 'text-tier-s border-tier-s',
  A: 'text-tier-a border-tier-a',
  B: 'text-tier-b border-tier-b',
  C: 'text-tier-c border-tier-c',
}

export function PersonCard({
  contact,
  selectable = false,
  selected = false,
  onToggleSelect,
  onOpenLog,
  onEdit,
}: {
  contact: Contact
  /** 단체 문자 선택 모드 (docs/06 §3) */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onOpenLog?: () => void
  onEdit?: () => void
}) {
  const t = useTranslations('crm')
  const tMerchant = useTranslations('merchant')
  const router = useRouter()
  const locale = useLocale()
  const overdue = overdueDays(contact)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  /** 미동의→안내, 동의+재료→AI 생성, 생성됨→랜딩으로 (사용자 확정 사양의 "버튼 하나"). */
  function handleHeroCard() {
    if (contact.storeId) return router.push(`/${locale}/s/${contact.storeId}`)
    if (!contact.consent.dataSharing) {
      setToast(t('needShareConsent'))
      setTimeout(() => setToast(null), 2200)
      return
    }
    startTransition(async () => {
      const result = await generateHeroForContact(contact.id)
      setToast(result.ok ? t('heroCardDone') : t('heroCardFailed'))
      setTimeout(() => setToast(null), 2200)
      if (result.ok) router.refresh()
    })
  }

  /** 랜딩 소개글(SEO 카피)만 다시 발행 — 매장 정보가 바뀌었을 때. */
  function handleSeo() {
    if (!contact.storeId) return
    startTransition(async () => {
      const result = await regenerateStoreSeo(contact.storeId!)
      setToast(result.ok ? tMerchant('seoRegenerated') : t('heroCardFailed'))
      setTimeout(() => setToast(null), 2200)
    })
  }

  return (
    <article
      className={cn(
        'relative rounded-card border bg-surface p-4',
        TIER_BORDER[contact.tier],
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-accent',
      )}
      onClick={selectable ? onToggleSelect : undefined}
    >
      {overdue > 0 && (
        <span className="absolute -top-1.5 -left-1.5 flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-pill bg-danger" />
          <span className="text-micro text-danger">{t('overdueDays', { n: overdue })}</span>
        </span>
      )}

      {selectable && (
        <input
          type="checkbox"
          readOnly
          checked={selected}
          className="absolute top-3 right-3 h-5 w-5 accent-[var(--accent)]"
          aria-label={contact.name}
        />
      )}

      <div className="flex gap-4">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-inner bg-surface-2">
          {contact.photoURL ? (
            <Image src={contact.photoURL} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-title text-content-muted">
              {contact.name.slice(0, 1)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="truncate text-subtitle text-content">{contact.name}</span>
              <TierBadge tier={contact.tier} />
            </p>
            {contact.company && (
              <p className="mt-0.5 truncate text-body text-content">{contact.company}</p>
            )}
            {contact.position && (
              <p className="truncate text-caption text-content-muted">{contact.position}</p>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="tabular mt-1 flex items-center gap-1.5 text-label text-content"
              >
                <Phone size={13} aria-hidden className="text-content-muted" />
                {contact.phone}
              </a>
            )}
            {contact.website && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-caption text-content-muted">
                <Globe size={13} aria-hidden />
                {contact.website}
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-1.5 text-content-muted">
              {contact.consent.dataSharing && <Camera size={15} aria-hidden />}
              {contact.consent.recording && <MessageCircle size={15} aria-hidden />}
            </p>
          </div>

          <div className="flex w-28 shrink-0 flex-col justify-between gap-1.5">
            <div>
              <p className="text-caption text-content-muted">{t('note')}</p>
              <p className="mt-0.5 line-clamp-2 text-label text-content">{contact.note}</p>
            </div>

            {/* 히어로 카드 — 있으면 보기, 없으면 버튼 하나로 생성 (동의 시) */}
            {contact.hasStoreDraft && (
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleHeroCard()
                }}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-chip px-2 py-1.5 text-center text-micro',
                  contact.storeId
                    ? 'bg-accent-soft text-accent-strong'
                    : 'bg-accent-strong text-accent-on',
                  pending && 'opacity-60',
                )}
              >
                <Sparkles size={12} aria-hidden />
                {pending
                  ? t('form.generating')
                  : contact.storeId
                    ? t('viewHeroCard')
                    : t('makeHeroCard')}
              </button>
            )}

            {/* 이미 매장이 있으면 랜딩 소개글만 다시 뽑을 수 있다 (사용자 확정 사양) */}
            {contact.storeId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeo()
                }}
                disabled={pending}
                className="flex items-center justify-center gap-1 rounded-chip border border-line px-2 py-1.5 text-center text-micro text-content-muted disabled:opacity-60"
              >
                <RefreshCw size={12} aria-hidden />
                {tMerchant('regenerateSeo')}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              className="flex items-center justify-center gap-1 rounded-chip border border-line px-2 py-1.5 text-center text-micro text-content-muted"
            >
              <Pencil size={12} aria-hidden />
              {t('editShort')}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenLog?.()
              }}
              className={cn(
                'rounded-chip border px-3 py-1.5 text-center text-label',
                TIER_TEXT[contact.tier],
              )}
            >
              {t('consultLog')}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </article>
  )
}
