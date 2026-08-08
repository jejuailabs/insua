'use client'

import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { HeroCarousel } from './HeroCarousel'
import { ProductGrid } from './ProductGrid'
import { CATEGORY_PRODUCTS, type Hero } from '@/lib/mock/home'

/**
 * 히어로 캐러셀 + 업종 연동 상품 섹션 (ref-04, docs/08 §6).
 * 카드를 넘기면 하단 섹션 제목·상품이 활성 히어로의 업종으로 통째로 바뀐다.
 * 음식점 → 제주 직거래, 카페 → 원두 & 디저트, 미용실 → 헤어 케어, 농부 → 신선 먹거리.
 */
export function FeedShowcase({ heroes }: { heroes: Hero[] }) {
  const t = useTranslations()
  const [index, setIndex] = useState(0)
  const category = heroes[index]!.category

  return (
    <>
      <HeroCarousel heroes={heroes} onIndexChange={setIndex} />

      <section className="mt-6 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-subtitle text-content">{t(`consumer.productSection.${category}`)}</h2>
          <span className="flex items-center gap-0.5 text-caption text-content-muted">
            {t('common.more')}
            <ChevronRight size={14} aria-hidden />
          </span>
        </div>
        <ProductGrid items={CATEGORY_PRODUCTS[category]} />
      </section>
    </>
  )
}
