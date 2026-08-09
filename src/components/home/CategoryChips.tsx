'use client'

import { useTranslations } from 'next-intl'
import { FILTER_CATEGORIES, RESTAURANT_SUBS, type FilterCategory } from './heroFilter'
import type { RestaurantSub } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/** 카테고리 5종 + 식당 세부 8종 2단 칩 (사용자 확정 사양) — 메인·히어로 허브 공용. */
export function CategoryChips({
  filter,
  subFilter,
  onFilter,
  onSubFilter,
}: {
  filter: FilterCategory | 'all'
  subFilter: RestaurantSub | null
  onFilter: (next: FilterCategory | 'all') => void
  onSubFilter: (next: RestaurantSub | null) => void
}) {
  const t = useTranslations()

  return (
    <>
      <div className="mb-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onFilter('all')}
          className={cn(
            'shrink-0 rounded-pill border px-2.5 py-1 text-micro',
            filter === 'all'
              ? 'border-accent bg-accent-strong text-accent-on'
              : 'border-line text-content-muted',
          )}
        >
          {t('consumer.categoryAll')}
        </button>
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onFilter(cat)}
            className={cn(
              'shrink-0 rounded-pill border px-2.5 py-1 text-micro',
              filter === cat
                ? 'border-accent bg-accent-strong text-accent-on'
                : 'border-line text-content-muted',
            )}
          >
            {t(`consumer.category.${cat}`)}
          </button>
        ))}
      </div>

      {filter === 'restaurant' && (
        <div className="mb-2 flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {RESTAURANT_SUBS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSubFilter(subFilter === sub ? null : sub)}
              className={cn(
                'shrink-0 rounded-pill border px-2.5 py-1 text-micro',
                subFilter === sub
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-line text-content-faint',
              )}
            >
              {t(`consumer.sub.${sub}`)}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
