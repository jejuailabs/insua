'use client'

import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import type { Hero, Perk } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/**
 * 메인 히어로 캐러셀 (docs/08, ref-04).
 *
 * 스크롤바 끌기가 아니라 **카드가 좌우로 밀려 들어오는 방식**이다.
 * 가운데 카드가 크게 서고 양옆 카드가 뒤에 걸쳐 보인다. 화살표·점·스와이프·키보드
 * 전부 같은 index 상태를 움직인다. 끝에서는 반대편으로 이어진다(무한).
 *
 * 모션은 transform/opacity 로만 준다 — 레이아웃을 건드리면 프레임이 튄다.
 * prefers-reduced-motion 은 globals.css 가 전역으로 잘라낸다 (docs/04 §7).
 */
export function HeroCarousel({
  heroes,
  onIndexChange,
}: {
  heroes: Hero[]
  /** 활성 카드가 바뀔 때 — 피드가 하단 상품 섹션을 업종에 맞춰 갈아끼운다 (ref-04). */
  onIndexChange?: (index: number) => void
}) {
  const t = useTranslations()
  const [index, setIndexRaw] = useState(0)
  const count = heroes.length

  const setIndex = useCallback(
    (next: number | ((i: number) => number)) => {
      setIndexRaw((i) => {
        const value = typeof next === 'function' ? next(i) : next
        onIndexChange?.(value)
        return value
      })
    },
    [onIndexChange],
  )

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count, setIndex],
  )

  // 스와이프 — 포인터 이벤트 하나로 마우스 드래그와 터치를 같이 받는다.
  const dragStart = useRef<number | null>(null)
  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    const start = dragStart.current
    dragStart.current = null
    if (start === null) return
    const dx = e.clientX - start
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('consumer.brand')}
      className="relative flex touch-pan-y flex-col items-center select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="relative aspect-[3/4] w-[min(20rem,74vw)]">
        {heroes.map((hero, i) => {
          // 가장 가까운 방향으로 감는다. 6장이면 offset 은 -3..2 사이.
          let offset = i - index
          if (offset > count / 2) offset -= count
          if (offset < -count / 2) offset += count

          const far = Math.abs(offset) > 1
          const active = offset === 0

          return (
            <article
              key={hero.id}
              aria-hidden={!active}
              className={cn(
                'absolute inset-0 overflow-hidden rounded-card border',
                'transition-[transform,opacity] duration-400 ease-out will-change-transform',
                active ? 'border-accent shadow-card' : 'border-line',
                far && 'pointer-events-none',
              )}
              style={{
                transform: `translateX(${offset * 62}%) scale(${active ? 1 : 0.84})`,
                opacity: far ? 0 : active ? 1 : 0.55,
                zIndex: 10 - Math.abs(offset),
              }}
            >
              <Image
                src={hero.image}
                alt=""
                fill
                sizes="(max-width: 768px) 74vw, 320px"
                className="object-cover"
                priority={i === 0}
              />

              {/* 사진 위 텍스트 대비를 확보한다. 색 리터럴 대신 검정 알파만 쓴다 (docs/04 §2). */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

              <span className="tabular absolute top-3 left-3 rounded-chip bg-black/50 px-2 py-1 text-micro text-white">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="absolute top-3 right-3 rounded-pill bg-black/50 px-3 py-1 text-micro text-white">
                {t(`consumer.category.${hero.category}`)}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-title text-white">{hero.name}</p>
                <p className="mt-0.5 text-caption text-white/80">{hero.tagline}</p>

                <p className="mt-2 flex items-center gap-1 text-label text-white">
                  <Star size={14} className="fill-current text-warning" aria-hidden />
                  <span className="tabular">
                    {t('format.rating', { rating: hero.rating, count: hero.reviews })}
                  </span>
                </p>

                <ul className="mt-3 flex gap-1.5">
                  {hero.perks.map((perk) => (
                    <PerkChip key={perkKey(perk)} perk={perk} />
                  ))}
                </ul>
              </div>
            </article>
          )
        })}

        <Arrow side="left" onClick={() => go(-1)} />
        <Arrow side="right" onClick={() => go(1)} />
      </div>

      <ul className="mt-3 flex items-center gap-1.5">
        {heroes.map((hero, i) => (
          <li key={hero.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={hero.name}
              aria-current={i === index}
              className={cn(
                'block h-1.5 rounded-pill transition-all duration-300',
                i === index ? 'w-5 bg-accent-strong' : 'w-1.5 bg-line-strong',
              )}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const t = useTranslations('common')
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? t('previous') : t('next')}
      className={cn(
        'absolute top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center',
        'rounded-pill bg-surface/90 text-content shadow-card transition-opacity hover:opacity-80',
        side === 'left' ? '-left-3' : '-right-3',
      )}
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}

function perkKey(perk: Perk): string {
  return perk.kind === 'hours' ? `hours-${perk.open}` : `${perk.kind}-${perkValue(perk)}`
}

function perkValue(perk: Perk): string {
  switch (perk.kind) {
    case 'discount':
      return `${perk.rate}%`
    case 'hours':
      return `${perk.open}–${perk.close}`
    default:
      return perk.value
  }
}

function PerkChip({ perk }: { perk: Perk }) {
  const t = useTranslations('consumer')
  const label =
    perk.kind === 'discount'
      ? t('discountShort')
      : perk.kind === 'hours'
        ? t('hours')
        : perk.kind === 'signature'
          ? t('signature')
          : t('gift')

  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-chip bg-black/45 px-2 py-2 text-center">
      <span className="w-full truncate text-label text-white">{perkValue(perk)}</span>
      <span className="w-full truncate text-micro text-white/70">{label}</span>
    </li>
  )
}
