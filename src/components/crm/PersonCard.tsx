'use client'

// 이 lucide 버전에는 브랜드 아이콘(Instagram)이 없다. 인스타는 Camera 로 대신한다.
import { Camera, Globe, MessageCircle, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { TierBadge } from '@/components/ui/TierBadge'
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
}: {
  contact: Contact
  /** 단체 문자 선택 모드 (docs/06 §3) */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onOpenLog?: () => void
}) {
  const t = useTranslations('crm')
  const overdue = overdueDays(contact)

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

          <div className="flex w-28 shrink-0 flex-col justify-between">
            <div>
              <p className="text-caption text-content-muted">{t('note')}</p>
              <p className="mt-0.5 line-clamp-2 text-label text-content">{contact.note}</p>
            </div>
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
    </article>
  )
}
