'use client'

import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

/**
 * 주소 → 지도 (임시 구현, 사용자 확정 사양).
 * 지오코딩은 OSM Nominatim, 표시는 OSM 임베드 — 키 없이 동작하는 MVP 수준이다.
 * OSM 공식 타일은 상업 대량 사용을 제한하므로, 트래픽이 붙기 전에 카카오맵
 * JS SDK(무료 쿼터 일 30만, JavaScript 키 필요)로 교체한다.
 */
export function MapEmbed({ address, className }: { address: string; className?: string }) {
  const t = useTranslations('merchant')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null | 'failed'>(null)

  useEffect(() => {
    if (!address) return
    let cancelled = false
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(address)}`,
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ lat: string; lon: string }>) => {
        if (cancelled) return
        const hit = rows[0]
        setCoords(hit ? { lat: Number(hit.lat), lon: Number(hit.lon) } : 'failed')
      })
      .catch(() => !cancelled && setCoords('failed'))
    return () => {
      cancelled = true
    }
  }, [address])

  if (!address || coords === null || coords === 'failed') {
    return (
      <div
        className={
          className ??
          'grid aspect-[4/3] w-32 shrink-0 place-items-center rounded-inner border border-line bg-surface-2'
        }
      >
        <span className="flex flex-col items-center gap-1 px-2 text-center text-content-muted">
          <MapPin size={20} aria-hidden className="text-accent-strong" />
          <span className="text-micro">
            {coords === 'failed' || !address ? address || '—' : '…'}
          </span>
        </span>
      </div>
    )
  }

  const { lat, lon } = coords
  const bbox = `${lon - 0.004},${lat - 0.0025},${lon + 0.004},${lat + 0.0025}`

  return (
    <div className={className ?? 'w-32 shrink-0'}>
      <iframe
        title={address}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
        className="aspect-[4/3] w-full rounded-inner border border-line"
        loading="lazy"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block text-center text-micro text-accent-strong"
      >
        {t('viewLargeMap')}
      </a>
    </div>
  )
}
