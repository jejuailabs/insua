'use client'

import { ChevronRight, TicketPercent } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { HeroCarousel } from './HeroCarousel'
import { ProductGrid } from './ProductGrid'
import { Modal } from '@/components/ui/Modal'
import { issueCoupon, toggleSaveStore } from '@/lib/consumer/actions'
import { CATEGORY_PRODUCTS, type Hero } from '@/lib/mock/home'

/**
 * 히어로 캐러셀 + 업종 연동 상품 섹션 (ref-04, docs/08 §6).
 * 카드를 넘기면 하단 섹션 제목·상품이 활성 히어로의 업종으로 통째로 바뀐다.
 *
 * 하트 = 찜 (docs/08 §8, 낙관적 업데이트). 할인 타일 = 쿠폰 시트 (docs/08 §7).
 * 비로그인이면 기능을 특정한 문구로 로그인을 유도한다 (docs/08 §10) — 일반 문구 금지.
 */
export function FeedShowcase({
  heroes,
  signedIn = false,
  initialSavedIds = [],
}: {
  heroes: Hero[]
  signedIn?: boolean
  initialSavedIds?: string[]
}) {
  const t = useTranslations()
  const [index, setIndex] = useState(0)
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [couponHero, setCouponHero] = useState<{ hero: Hero; rate: number } | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const category = heroes[index]!.category

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function handleSave(heroId: string) {
    if (!signedIn) return showToast(t('consumer.loginToSave'))
    // 낙관적 토글 — 실패하면 되돌린다.
    const wasSaved = savedIds.includes(heroId)
    setSavedIds((ids) => (wasSaved ? ids.filter((v) => v !== heroId) : [...ids, heroId]))
    startTransition(async () => {
      const result = await toggleSaveStore(heroId)
      if (!result.ok) {
        setSavedIds((ids) => (wasSaved ? [...ids, heroId] : ids.filter((v) => v !== heroId)))
      }
    })
  }

  function handleCoupon(hero: Hero, rate: number) {
    if (!signedIn) return showToast(t('consumer.loginToCoupon'))
    setCouponCode(null)
    setCouponHero({ hero, rate })
  }

  function claimCoupon() {
    if (!couponHero || pending) return
    startTransition(async () => {
      const result = await issueCoupon(couponHero.hero.id, couponHero.rate)
      if (result.ok && result.value) setCouponCode(result.value)
    })
  }

  return (
    <>
      <HeroCarousel
        heroes={heroes}
        onIndexChange={setIndex}
        savedIds={savedIds}
        onToggleSave={handleSave}
        onCouponClick={handleCoupon}
      />

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

      <Modal
        open={couponHero !== null}
        onClose={() => setCouponHero(null)}
        title={t('consumer.couponTitle')}
        description={couponHero ? `${couponHero.hero.name} · ${couponHero.rate}%` : undefined}
      >
        {couponCode ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <p className="text-caption text-content-muted">{t('consumer.couponIssued')}</p>
            <p className="tabular rounded-chip bg-accent-soft px-6 py-3 text-title text-accent-strong">
              {couponCode}
            </p>
            <p className="text-micro text-content-faint">{t('consumer.couponCode')}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={claimCoupon}
            disabled={pending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
          >
            <TicketPercent size={18} aria-hidden />
            {t('consumer.couponGet')}
          </button>
        )}
      </Modal>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
