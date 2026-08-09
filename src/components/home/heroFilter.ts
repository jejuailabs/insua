import type { HeroCategory, RestaurantSub } from '@/lib/mock/home'

/** 메인·히어로 허브 공용 카테고리 필터 5종 (사용자 확정 사양) — 앞 4개에 안 걸리면 전부 기타. */
export const FILTER_CATEGORIES = ['restaurant', 'cafe', 'salon', 'farm', 'etc'] as const
export type FilterCategory = (typeof FILTER_CATEGORIES)[number]

export const RESTAURANT_SUBS: RestaurantSub[] = [
  'meat',
  'seafood',
  'korean',
  'chinese',
  'japanese',
  'western',
  'snack',
  'chicken',
]

export function bucketOf(category: HeroCategory): FilterCategory {
  return (['restaurant', 'cafe', 'salon', 'farm'] as const).includes(
    category as 'restaurant' | 'cafe' | 'salon' | 'farm',
  )
    ? (category as FilterCategory)
    : 'etc'
}
