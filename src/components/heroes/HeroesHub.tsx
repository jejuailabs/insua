'use client'

import { Heart, LayoutGrid, Map as MapIcon, MapPin, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { CategoryChips, SubChips } from '@/components/home/CategoryChips'
import { bucketOf, type FilterCategory } from '@/components/home/heroFilter'
import { RadiusChips } from '@/components/home/RadiusChips'
import { HeroMap } from './HeroMap'
import { toggleSaveStore } from '@/lib/consumer/actions'
import { VISIT_GLOW, visitTierOf } from '@/lib/consumer/visitTier'
import type { Hero, RestaurantSub } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/**
 * 히어로 허브 (사용자 확정 사양) — 우리동네 로컬 히어로 피드.
 * 반경 캡(1km 15 / 3km 30 / 5km 50), 카테고리 2단 필터, 추천/거리순, 그리드/지도 보기.
 * 처음 10장만 그리고 스크롤이 닿으면 10장씩 더 그린다 — 데이터는 이미 서버가
 * 한 번에 내려줬으므로(≤50) 여기서의 짧은 로딩은 DOM 렌더 분산용이다.
 */

const RADIUS_CAP: Record<number, number> = { 1: 15, 3: 30, 5: 50 }
const PAGE = 10

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function HeroesHub({
  heroes,
  signedIn,
  initialSavedIds,
  visitCounts,
}: {
  heroes: Hero[]
  signedIn: boolean
  initialSavedIds: string[]
  visitCounts: Record<string, number>
}) {
  const t = useTranslations()
  const locale = useLocale()
  const [radius, setRadius] = useState(3)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [filter, setFilter] = useState<FilterCategory | 'all'>('all')
  const [subFilter, setSubFilter] = useState<RestaurantSub | null>(null)
  const [sort, setSort] = useState<'reco' | 'near'>('reco')
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [shownCount, setShownCount] = useState(PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const filtered = heroes.filter((hero) => {
    if (filter === 'all') return true
    if (bucketOf(hero.category) !== filter) return false
    if (filter === 'restaurant' && subFilter) return hero.subCategory === subFilter
    return true
  })
  const sorted =
    sort === 'near' && userPos
      ? [...filtered].sort((a, b) => {
          const da =
            a.lat !== undefined ? distanceKm(userPos, { lat: a.lat, lng: a.lng! }) : Infinity
          const db =
            b.lat !== undefined ? distanceKm(userPos, { lat: b.lat, lng: b.lng! }) : Infinity
          return da - db
        })
      : filtered
  const capped = sorted.slice(0, RADIUS_CAP[radius] ?? 30)
  const visible = capped.slice(0, shownCount)
  const hasMore = shownCount < capped.length

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || view !== 'grid') return
    const loadMore = () => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoadingMore(true)
      // 살짝의 로딩 전환 (사용자 확정 사양) — 큰 DOM 을 한 번에 밀어넣지 않는다
      setTimeout(() => {
        setShownCount((n) => n + PAGE)
        setLoadingMore(false)
        loadingRef.current = false
      }, 300)
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    })
    observer.observe(sentinel)
    const onScroll = () => {
      if (sentinel.getBoundingClientRect().top < window.innerHeight + 160) loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [hasMore, view])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function handleSave(heroId: string) {
    if (!signedIn) return showToast(t('consumer.loginToSave'))
    const wasSaved = savedIds.includes(heroId)
    setSavedIds((ids) => (wasSaved ? ids.filter((v) => v !== heroId) : [...ids, heroId]))
    startTransition(async () => {
      const result = await toggleSaveStore(heroId)
      if (!result.ok) {
        setSavedIds((ids) => (wasSaved ? [...ids, heroId] : ids.filter((v) => v !== heroId)))
      }
    })
  }

  function pickNear() {
    if (sort === 'near') return setSort('reco')
    if (userPos) return setSort('near')
    if (!('geolocation' in navigator)) return showToast(t('consumer.locationDenied'))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSort('near')
      },
      () => showToast(t('consumer.locationDenied')),
      { timeout: 5000 },
    )
  }

  return (
    <>
      {/* 한 줄: 반경 세그먼트 · 카테고리 · 정렬 · 보기 전환 (사용자 확정 사양) */}
      <div className="mt-3 mb-2 flex items-center gap-2">
        <RadiusChips
          onChange={(km) => {
            setRadius(km)
            setShownCount(PAGE)
          }}
          onLocated={setUserPos}
        />

        <span aria-hidden className="h-4 w-px shrink-0 bg-line" />

        <CategoryChips
          filter={filter}
          onFilter={(next) => {
            setFilter(next)
            setSubFilter(null)
            setShownCount(PAGE)
          }}
        />

        <div className="flex shrink-0 items-center gap-1.5">
          {(
            [
              { id: 'reco', label: t('consumer.sortReco') },
              { id: 'near', label: t('consumer.sortNearby') },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => (id === 'near' ? pickNear() : setSort('reco'))}
              aria-pressed={sort === id}
              className={cn(
                'rounded-pill border px-2.5 py-1 text-micro',
                sort === id
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-line text-content-muted',
              )}
            >
              {label}
            </button>
          ))}
          <div className="ml-1 flex gap-1">
            {(
              [
                { id: 'grid', icon: LayoutGrid, label: t('consumer.viewCard') },
                { id: 'map', icon: MapIcon, label: t('consumer.viewMapToggle') },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                aria-label={label}
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-chip border',
                  view === id
                    ? 'border-accent bg-accent-soft text-accent-strong'
                    : 'border-line text-content-muted',
                )}
              >
                <Icon size={13} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      {filter === 'restaurant' && (
        <SubChips
          subFilter={subFilter}
          onSubFilter={(next) => {
            setSubFilter(next)
            setShownCount(PAGE)
          }}
        />
      )}

      {view === 'map' ? (
        <HeroMap heroes={capped} userPos={userPos} />
      ) : visible.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-8 text-center text-caption text-content-muted">
          {t('consumer.noMatch')}
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((hero) => {
              const visits = visitCounts[hero.id] ?? 0
              const tier = visitTierOf(visits)
              const saved = savedIds.includes(hero.id)
              const km =
                userPos && hero.lat !== undefined
                  ? distanceKm(userPos, { lat: hero.lat, lng: hero.lng! })
                  : null
              return (
                <li key={hero.id} className="relative">
                  <Link
                    href={`/${locale}/s/${hero.id}`}
                    className="block overflow-hidden rounded-card border border-line bg-surface"
                    style={tier ? { boxShadow: VISIT_GLOW[tier] } : undefined}
                  >
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={hero.image}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 50vw, 240px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <span className="absolute top-2 left-2 rounded-pill bg-black/50 px-2 py-0.5 text-micro text-white">
                        {t(`consumer.category.${hero.category}`)}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-subtitle text-white">{hero.name}</p>
                        <p className="mt-0.5 truncate text-micro text-white/80">{hero.tagline}</p>
                        <p className="mt-1 flex items-center gap-2 text-micro text-white">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="fill-current text-warning" aria-hidden />
                            <span className="tabular">
                              {t('format.rating', { rating: hero.rating, count: hero.reviews })}
                            </span>
                          </span>
                          {km !== null && (
                            <span className="tabular flex items-center gap-0.5 text-white/85">
                              <MapPin size={10} aria-hidden />
                              {km < 10 ? km.toFixed(1) : Math.round(km)}km
                            </span>
                          )}
                        </p>
                      </div>
                      {/* 단골 등급 배지 — 방문이력이 많을수록 동→은→금 */}
                      {tier && (
                        <span
                          className="tabular absolute right-2 bottom-2 rounded-pill px-2 py-0.5 text-micro"
                          style={{
                            backgroundColor: `var(--visit-${tier})`,
                            color: `var(--visit-${tier}-on)`,
                          }}
                        >
                          {t('consumer.visitCount', { n: visits })}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleSave(hero.id)}
                    aria-pressed={saved}
                    aria-label={t('nav.saved')}
                    className={cn(
                      'absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-pill bg-black/45',
                      'text-white transition-transform active:scale-90',
                      saved && 'text-accent',
                    )}
                  >
                    <Heart size={15} aria-hidden className={saved ? 'fill-current' : undefined} />
                  </button>
                </li>
              )
            })}
          </ul>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <span
                aria-hidden
                className={cn(
                  'h-5 w-5 rounded-pill border-2 border-line border-t-accent',
                  loadingMore && 'animate-spin',
                )}
              />
            </div>
          )}
        </>
      )}

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
