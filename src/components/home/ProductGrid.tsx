'use client'

import { Heart, ShoppingCart, Truck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { MarketItem } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/**
 * 직거래 상품 그리드 (docs/08 §6) — 모바일 3열.
 * 상품을 누르면 쇼핑몰 상세(/market/{id})로 간다 (사용자 확정 사양).
 * 하트 = 찜 토글(낙관적). 결제는 스코프 밖.
 */
export function ProductGrid({
  items,
  large = false,
}: {
  items: MarketItem[]
  /** true 면 PC 쇼핑몰 수준의 큰 카드 (사용자 확정 사양 — 마켓 페이지). */
  large?: boolean
}) {
  const t = useTranslations()
  const locale = useLocale()
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)

  function save(id: string) {
    setSaved((m) => ({ ...m, [id]: !m[id] }))
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  return (
    <>
      <ul
        className={cn(
          'mt-3 grid',
          large ? 'grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4' : 'grid-cols-3 gap-2 lg:grid-cols-6',
        )}
      >
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-inner border border-line bg-surface">
            <Link href={`/${locale}/market/${item.id}`} className="relative block aspect-square">
              <Image
                src={item.image}
                alt=""
                fill
                sizes={large ? '(max-width: 1024px) 50vw, 260px' : '33vw'}
                className="object-cover"
              />
              {item.best && (
                <span className="absolute top-1.5 left-1.5 rounded-chip bg-accent-strong px-1.5 py-0.5 text-micro text-accent-on">
                  BEST
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  save(item.id)
                }}
                aria-pressed={Boolean(saved[item.id])}
                aria-label={t('nav.saved')}
                className={cn(
                  'absolute top-1.5 right-1.5 text-white drop-shadow transition-transform active:scale-90',
                  saved[item.id] && 'text-accent-strong',
                )}
              >
                <Heart
                  size={16}
                  aria-hidden
                  className={saved[item.id] ? 'fill-current' : undefined}
                />
              </button>
            </Link>
            <div className={large ? 'p-3' : 'p-2'}>
              <p className={cn('truncate text-content', large ? 'text-body' : 'text-label')}>
                {item.name}
              </p>
              <p
                className={cn(
                  'mt-0.5 truncate text-content-muted',
                  large ? 'text-caption' : 'text-micro',
                )}
              >
                {item.sub}
              </p>
              {/* 배달 칩 (사용자 확정 사양) — 가능할 때만, 배달비까지 한눈에 */}
              {item.deliveryAvailable && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2 py-0.5 text-micro text-accent-strong">
                  <Truck size={11} aria-hidden />
                  <span className="tabular">
                    {item.deliveryFee
                      ? t('market.deliveryFeeValue', { amount: item.deliveryFee.toLocaleString() })
                      : t('market.deliveryFree')}
                  </span>
                </span>
              )}
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'tabular truncate text-content',
                    large ? 'text-subtitle' : 'text-label',
                  )}
                >
                  {t('format.currency', { amount: item.price.toLocaleString() })}
                </span>
                <button
                  type="button"
                  onClick={() => save(item.id)}
                  aria-label={t('nav.saved')}
                  className="shrink-0 text-accent-strong"
                >
                  <ShoppingCart size={large ? 18 : 15} aria-hidden />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {t('common.save')}
        </p>
      )}
    </>
  )
}
