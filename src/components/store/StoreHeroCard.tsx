'use client'

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageSquareText,
  Star,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'
import { TierBadge } from '@/components/ui/TierBadge'
import type { Store } from '@/lib/mock/store'
import { cn } from '@/lib/utils/cn'

/**
 * 내 매장 히어로 카드 캐러셀 (ref-01, docs/07 B-1).
 * 번호 배지 + 등급 배지, 상호·태그라인, 평점·리뷰, 영업시간·주소,
 * [자세히 보기] + 하트. 양옆 카드가 뒤에 걸쳐 보이고 화살표로 넘긴다.
 */
export function StoreHeroCard({
  stores,
  index,
  onIndexChange,
  onDetail,
}: {
  stores: Store[]
  index: number
  onIndexChange: (i: number) => void
  onDetail?: (store: Store) => void
}) {
  const t = useTranslations()
  const count = stores.length
  const [liked, setLiked] = useState<Record<string, boolean>>({ [stores[0]!.id]: true })

  const go = (delta: number) => onIndexChange((index + delta + count) % count)

  return (
    <section aria-roledescription="carousel" className="relative select-none">
      <div className="relative aspect-[4/5] w-full overflow-visible">
        {stores.map((store, i) => {
          let offset = i - index
          if (offset > count / 2) offset -= count
          if (offset < -count / 2) offset += count
          const far = Math.abs(offset) > 1
          const active = offset === 0

          return (
            <article
              key={store.id}
              aria-hidden={!active}
              className={cn(
                'absolute inset-0 overflow-hidden rounded-card border',
                'transition-[transform,opacity] duration-400 ease-out will-change-transform',
                active ? 'border-accent shadow-card' : 'border-line',
                far && 'pointer-events-none',
              )}
              style={{
                transform: `translateX(${offset * 88}%) scale(${active ? 1 : 0.9})`,
                opacity: far ? 0 : active ? 1 : 0.45,
                zIndex: 10 - Math.abs(offset),
              }}
            >
              <Image
                src={store.heroImage}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 420px"
                className="object-cover"
                priority={i === 0}
              />
              {/* 사진 위 텍스트 대비 — 색 리터럴 대신 검정 알파만 (docs/04 §2) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35" />

              <span className="tabular absolute top-3 left-3 rounded-chip bg-black/50 px-2 py-1 text-label text-white">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="absolute top-3 right-3">
                <TierBadge tier={store.tier} />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-4 text-right">
                <h2 className="text-display text-white">{store.name}</h2>
                <p className="mt-1 text-body text-white/85">{store.tagline}</p>

                <p className="mt-2.5 flex items-center justify-end gap-3 text-label text-white">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="fill-current text-warning" aria-hidden />
                    <span className="tabular">
                      {t('format.rating', { rating: store.rating, count: store.ratingCount })}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-white/85">
                    <MessageSquareText size={13} aria-hidden />
                    {t('format.reviewCount', { count: store.reviewCount })}
                  </span>
                </p>

                <p className="tabular mt-2 flex items-center justify-end gap-1.5 text-label text-white/90">
                  <Clock size={13} aria-hidden />
                  {store.hours.open} - {store.hours.close}
                </p>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-label text-white/90">
                  <MapPin size={13} aria-hidden />
                  {store.address}
                </p>

                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onDetail?.(store)}
                    className="rounded-chip border border-white/60 px-4 py-2 text-label text-white transition-opacity hover:opacity-80"
                  >
                    {t('merchant.viewDetail')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={Boolean(liked[store.id])}
                    aria-label={t('nav.saved')}
                    onClick={() => setLiked((m) => ({ ...m, [store.id]: !m[store.id] }))}
                    className="grid h-10 w-10 place-items-center text-white transition-transform active:scale-90"
                  >
                    <Heart
                      size={22}
                      aria-hidden
                      className={liked[store.id] ? 'fill-current' : undefined}
                    />
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('common.previous')}
          className="absolute top-1/2 -left-2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-pill bg-surface/90 text-content shadow-card"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('common.next')}
          className="absolute top-1/2 -right-2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-pill bg-surface/90 text-content shadow-card"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </section>
  )
}
