'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { PinMap } from '@/components/map/PinMap'
import type { Hero } from '@/lib/mock/home'

/** 히어로 지도 보기 — 공용 PinMap 에 히어로를 얹고, 핀을 누르면 랜딩으로 간다. */
export function HeroMap({
  heroes,
  userPos,
}: {
  heroes: Hero[]
  userPos: { lat: number; lng: number } | null
}) {
  const router = useRouter()
  const locale = useLocale()
  const pins = heroes
    .filter((h) => h.lat !== undefined && h.lng !== undefined)
    .map((h) => ({ id: h.id, label: h.name, lat: h.lat!, lng: h.lng! }))

  return (
    <PinMap pins={pins} userPos={userPos} onPinClick={(id) => router.push(`/${locale}/s/${id}`)} />
  )
}
