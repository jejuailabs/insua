'use client'

import { useTranslations } from 'next-intl'
import { FILTER_CATEGORIES, RESTAURANT_SUBS, type FilterCategory } from './heroFilter'
import type { RestaurantSub } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/**
 * 카테고리 칩 (사용자 확정 사양) — 메인·히어로 허브 공용.
 * 반경 세그먼트·뷰 토글과 **한 줄**에 서므로, 자기 여백을 갖지 않고
 * 남는 폭에서만 가로 스크롤한다. 세부 업종은 별도 줄(SubChips).
 */
export function CategoryChips({
  filter,
  onFilter,
}: {
  filter: FilterCategory | 'all'
  onFilter: (next: FilterCategory | 'all') => void
}) {
  const t = useTranslations()

  return (
    <div className="flex min-w-0 flex-1 [scrollbar-width:none] gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
  )
}

/** 식당 세부 업종 8종 — 음식점을 고른 경우에만 다음 줄에 펼친다. */
export function SubChips({
  subFilter,
  onSubFilter,
}: {
  subFilter: RestaurantSub | null
  onSubFilter: (next: RestaurantSub | null) => void
}) {
  const t = useTranslations()

  return (
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
  )
}
