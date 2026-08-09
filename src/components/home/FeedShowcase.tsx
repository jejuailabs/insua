'use client'

import { ChevronRight, LayoutGrid, Rows3, Star, TicketPercent } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { HeroCarousel } from './HeroCarousel'
import { ProductGrid } from './ProductGrid'
import { Modal } from '@/components/ui/Modal'
import { issueCoupon, toggleSaveStore } from '@/lib/consumer/actions'
import { CATEGORY_PRODUCTS, type Hero } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

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
  const locale = useLocale()
  const [index, setIndex] = useState(0)
  const [view, setView] = useState<'card' | 'list'>('card')
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [couponHero, setCouponHero] = useState<{ hero: Hero; rate: number } | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const category = heroes[Math.min(index, heroes.length - 1)]!.category

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
      {/* 카드형 / 목록형 토글 (사용자 확정 사양) */}
      <div className="mb-3 flex justify-end gap-1">
        {(
          [
            { id: 'card', icon: LayoutGrid, label: t('consumer.viewCard') },
            { id: 'list', icon: Rows3, label: t('consumer.viewList') },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            aria-pressed={view === id}
            className={cn(
              'flex items-center gap-1 rounded-chip border px-2.5 py-1.5 text-micro',
              view === id
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-line text-content-muted',
            )}
          >
            <Icon size={13} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {view === 'card' ? (
        <HeroCarousel
          heroes={heroes}
          onIndexChange={setIndex}
          savedIds={savedIds}
          onToggleSave={handleSave}
          onCouponClick={handleCoupon}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {heroes.map((hero, i) => (
            <li key={hero.id}>
              <Link
                href={`/${locale}/s/${hero.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-card border bg-surface p-3',
                  i === index ? 'border-accent' : 'border-line',
                )}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-inner">
                  <Image src={hero.image} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-subtitle text-content">{hero.name}</p>
                  <p className="truncate text-caption text-content-muted">{hero.tagline}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-caption text-content">
                    <Star size={12} className="fill-current text-warning" aria-hidden />
                    <span className="tabular">
                      {t('format.rating', { rating: hero.rating, count: hero.reviews })}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 rounded-pill bg-surface-2 px-2.5 py-1 text-micro text-content-muted">
                  {t(`consumer.category.${hero.category}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

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
