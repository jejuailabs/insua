import { ChevronRight, ShoppingCart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import type { MarketItem } from '@/lib/mock/home'

/** 메인 하단 마켓 레일 (docs/08, ref-04). 카드 폭은 3열이 살짝 넘겨 보이게 잡는다. */
export async function MarketRail({ items }: { items: MarketItem[] }) {
  const t = await getTranslations()

  return (
    <section className="mt-6 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-subtitle text-content">{t('consumer.todayFresh')}</h2>
        <span className="flex items-center gap-0.5 text-caption text-content-muted">
          {t('common.more')}
          <ChevronRight size={14} aria-hidden />
        </span>
      </div>

      <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="w-32 shrink-0 overflow-hidden rounded-inner border border-line bg-surface-2"
          >
            <div className="relative aspect-square">
              <Image src={item.image} alt="" fill sizes="128px" className="object-cover" />
              {item.best && (
                <span className="absolute top-1.5 left-1.5 rounded-chip bg-accent-strong px-1.5 py-0.5 text-micro text-accent-on">
                  BEST
                </span>
              )}
            </div>

            <div className="p-2">
              <p className="truncate text-label text-content">{item.name}</p>
              <p className="mt-0.5 truncate text-micro text-content-muted">{item.sub}</p>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="tabular truncate text-label text-content">
                  {t('format.currency', { amount: item.price.toLocaleString() })}
                </span>
                <ShoppingCart size={16} className="shrink-0 text-accent-strong" aria-hidden />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
