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

  /** 히어로 이미지 재생성 — 프롬프트가 개선됐을 때 기존 카드도 다시 뽑는다 (사용자 지적). */
  function handleRemakeHero() {
    if (!contact.storeId || pending) return
    startTransition(async () => {
      const result = await generateHeroForContact(contact.id)
      setToast(result.ok ? t('heroCardDone') : t('heroCardFailed'))
      setTimeout(() => setToast(null), 2200)
      if (result.ok) router.refresh()
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

        {/* 정보는 한 컬럼으로 폭 전체를 쓴다 — 좁은 화면에서 이름·전화가 잘리지 않는다 (사용자 지적) */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
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
      </div>

      {/* 특이사항 — 한 줄로 폭 전체 */}
      {contact.note && (
        <p className="mt-2.5 truncate text-caption text-content">
          <span className="text-content-muted">{t('note')}</span>
          <span className="mx-1.5 text-content-faint">·</span>
          {contact.note}
        </p>
      )}

      {/* 액션 — 세로로 짓누르던 우측 컬럼 대신 하단 가로 배치 */}
      <div className="mt-3 flex flex-col gap-1.5">
        {contact.hasStoreDraft && !contact.storeId && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation()
              handleHeroCard()
            }}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
          >
            <Sparkles size={14} aria-hidden />
            {pending ? t('form.generating') : t('makeHeroCard')}
          </button>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {contact.storeId && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleHeroCard()
                }}
                className="col-span-2 flex min-h-10 items-center justify-center gap-1.5 rounded-chip bg-accent-soft text-label text-accent-strong disabled:opacity-60"
              >
                <Sparkles size={14} aria-hidden />
                {t('viewHeroCard')}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemakeHero()
                }}
                className="flex min-h-9 items-center justify-center gap-1 rounded-chip border border-line text-micro text-content-muted disabled:opacity-60"
              >
                <Sparkles size={12} aria-hidden />
                {pending ? t('form.generating') : t('remakeHeroCard')}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeo()
                }}
                className="flex min-h-9 items-center justify-center gap-1 rounded-chip border border-line text-micro text-content-muted disabled:opacity-60"
              >
                <RefreshCw size={12} aria-hidden />
                {tMerchant('regenerateSeo')}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="flex min-h-9 items-center justify-center gap-1 rounded-chip border border-line text-micro text-content-muted"
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
              'flex min-h-9 items-center justify-center rounded-chip border text-micro',
              TIER_TEXT[contact.tier],
              // 매장 없는 카드는 버튼이 2개(수정·상담로그)뿐이라 그대로 한 줄을 채운다
            )}
          >
            {t('consultLog')}
          </button>
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
