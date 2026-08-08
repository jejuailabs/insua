// 이 lucide 버전에는 브랜드 아이콘(Instagram)이 없다. 인스타는 Camera 로 대신한다.
import { Camera, Globe, MessageCircle, Phone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { TierBadge } from '@/components/ui/TierBadge'
import type { Contact, Tier } from '@/lib/mock/crm'
import { cn } from '@/lib/utils/cn'

/** 등급색 테두리 + 다크에서 발광 (docs/06 §5). 글로우는 tokens 의 tier 색 22 알파. */
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

export async function PersonCard({ contact }: { contact: Contact }) {
  const t = await getTranslations('crm')

  return (
    <article
      className={cn('relative rounded-card border bg-surface p-4', TIER_BORDER[contact.tier])}
    >
      {contact.overdueDays !== undefined && contact.overdueDays > 0 && (
        <span className="absolute -top-1.5 -left-1.5 flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-pill bg-danger" />
          <span className="text-micro text-danger">
            {t('overdueDays', { n: contact.overdueDays })}
          </span>
        </span>
      )}

      <div className="flex gap-4">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-inner bg-surface-2">
          <Image src={contact.photo} alt="" fill sizes="80px" className="object-cover" />
        </div>

        <div className="flex min-w-0 flex-1 gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="truncate text-subtitle text-content">{contact.name}</span>
              <TierBadge tier={contact.tier} />
            </p>
            <p className="mt-0.5 truncate text-body text-content">{contact.company}</p>
            <p className="truncate text-caption text-content-muted">{contact.position}</p>
            <p className="tabular mt-1 flex items-center gap-1.5 text-label text-content">
              <Phone size={13} aria-hidden className="text-content-muted" />
              {contact.phone}
            </p>
            {contact.website && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-caption text-content-muted">
                <Globe size={13} aria-hidden />
                {contact.website}
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-1.5 text-content-muted">
              {contact.socials?.includes('instagram') && <Camera size={15} aria-hidden />}
              {contact.socials?.includes('kakao') && <MessageCircle size={15} aria-hidden />}
            </p>
          </div>

          <div className="flex w-28 shrink-0 flex-col justify-between">
            <div>
              <p className="text-caption text-content-muted">{t('note')}</p>
              <p className="mt-0.5 line-clamp-2 text-label text-content">{contact.note}</p>
            </div>
            <span
              className={cn(
                'rounded-chip border px-3 py-1.5 text-center text-label',
                TIER_TEXT[contact.tier],
              )}
            >
              {t('consultLog')}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
