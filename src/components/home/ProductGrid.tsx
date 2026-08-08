import { Heart, ShoppingCart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import type { MarketItem } from '@/lib/mock/home'

/** 직거래 상품 그리드 (docs/08 §6) — 모바일 3열. 장바구니·결제는 스코프 밖, 표시만. */
export async function ProductGrid({ items }: { items: MarketItem[] }) {
  const t = await getTranslations()

  return (
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
            <span className="absolute top-1.5 right-1.5 text-white drop-shadow">
              <Heart size={16} aria-hidden />
            </span>
          </div>
          <div className="p-2">
            <p className="truncate text-label text-content">{item.name}</p>
            <p className="mt-0.5 truncate text-micro text-content-muted">{item.sub}</p>
            <div className="mt-1.5 flex items-center justify-between gap-1">
              <span className="tabular truncate text-label text-content">
                {t('format.currency', { amount: item.price.toLocaleString() })}
              </span>
              <ShoppingCart size={15} className="shrink-0 text-accent-strong" aria-hidden />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
