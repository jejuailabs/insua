'use client'

import { Heart, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'
import type { MarketItem } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/**
 * 직거래 상품 그리드 (docs/08 §6) — 모바일 3열.
 * 하트 = 찜 토글(낙관적). 장바구니·결제는 스코프 밖 — 저장 토스트까지만.
 */
export function ProductGrid({ items }: { items: MarketItem[] }) {
  const t = useTranslations()
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)

  function save(id: string) {
    setSaved((m) => ({ ...m, [id]: !m[id] }))
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  return (
    <>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-inner border border-line bg-surface">
            <div className="relative aspect-square">
              <Image src={item.image} alt="" fill sizes="33vw" className="object-cover" />
              {item.best && (
                <span className="absolute top-1.5 left-1.5 rounded-chip bg-accent-strong px-1.5 py-0.5 text-micro text-accent-on">
                  BEST
                </span>
              )}
              <button
                type="button"
                onClick={() => save(item.id)}
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
            </div>
            <div className="p-2">
              <p className="truncate text-label text-content">{item.name}</p>
              <p className="mt-0.5 truncate text-micro text-content-muted">{item.sub}</p>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="tabular truncate text-label text-content">
                  {t('format.currency', { amount: item.price.toLocaleString() })}
                </span>
                <button
                  type="button"
                  onClick={() => save(item.id)}
                  aria-label={t('nav.saved')}
                  className="shrink-0 text-accent-strong"
                >
                  <ShoppingCart size={15} aria-hidden />
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
