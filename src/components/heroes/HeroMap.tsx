'use client'

import { Minus, Plus } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import type { Hero } from '@/lib/mock/home'

/**
 * 히어로 지도 보기 (사용자 확정 사양) — OSM 래스터 타일 + 자체 핀.
 * 외부 지도 라이브러리 없이 웹 메르카토르 투영을 직접 계산한다.
 * MapEmbed 와 같은 이유로 임시 구현 — 트래픽이 붙기 전에 카카오맵 SDK 로 교체한다.
 */

const TILE = 256
const JEJU_CENTER = { lat: 33.38, lng: 126.55 }

function worldPx(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom
  const x = ((lng + 180) / 360) * scale
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale
  return { x, y }
}

function pxToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE * 2 ** zoom
  const lng = (x / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / scale
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  return { lat, lng }
}

export function HeroMap({
  heroes,
  userPos,
}: {
  heroes: Hero[]
  userPos: { lat: number; lng: number } | null
}) {
  const router = useRouter()
  const locale = useLocale()
  const pinned = heroes.filter((h) => h.lat !== undefined && h.lng !== undefined)

  const initial =
    userPos ??
    (pinned.length
      ? {
          lat: pinned.reduce((a, h) => a + h.lat!, 0) / pinned.length,
          lng: pinned.reduce((a, h) => a + h.lng!, 0) / pinned.length,
        }
      : JEJU_CENTER)
  const [center, setCenter] = useState(initial)
  const [zoom, setZoom] = useState(10)
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)

  const c = worldPx(center.lat, center.lng, zoom)
  const cTileX = Math.floor(c.x / TILE)
  const cTileY = Math.floor(c.y / TILE)
  const maxTile = 2 ** zoom - 1

  // 중심 기준 7×5 타일 — 최대 1792×1280px 커버 (컨테이너보다 넉넉하게)
  const tiles: Array<{ tx: number; ty: number }> = []
  for (let ty = cTileY - 2; ty <= cTileY + 2; ty++) {
    for (let tx = cTileX - 3; tx <= cTileX + 3; tx++) {
      if (ty >= 0 && ty <= maxTile) tiles.push({ tx, ty })
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
    setDrag({ dx, dy })
  }
  function onPointerUp() {
    if (dragStart.current && drag) {
      setCenter(pxToLatLng(c.x - drag.dx, c.y - drag.dy, zoom))
    }
    dragStart.current = null
    setDrag(null)
  }

  const shift = drag ?? { dx: 0, dy: 0 }

  return (
    <div
      className="relative aspect-[4/5] touch-none overflow-hidden rounded-card border border-line bg-surface-2 select-none sm:aspect-[16/9]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* 타일 레이어 — 중앙 기준 픽셀 오프셋 배치 */}
      {tiles.map(({ tx, ty }) => (
        // eslint-disable-next-line @next/next/no-img-element -- OSM 타일은 최적화 프록시를 안 거친다
        <img
          key={`${zoom}/${tx}/${ty}`}
          src={`https://tile.openstreetmap.org/${zoom}/${((tx % (maxTile + 1)) + maxTile + 1) % (maxTile + 1)}/${ty}.png`}
          alt=""
          draggable={false}
          loading="lazy"
          className="pointer-events-none absolute max-w-none"
          style={{
            width: TILE,
            height: TILE,
            left: `calc(50% + ${tx * TILE - c.x + shift.dx}px)`,
            top: `calc(50% + ${ty * TILE - c.y + shift.dy}px)`,
          }}
        />
      ))}

      {/* 내 위치 */}
      {userPos &&
        (() => {
          const p = worldPx(userPos.lat, userPos.lng, zoom)
          return (
            <span
              aria-hidden
              className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-surface bg-info shadow-card"
              style={{
                left: `calc(50% + ${p.x - c.x + shift.dx}px)`,
                top: `calc(50% + ${p.y - c.y + shift.dy}px)`,
              }}
            />
          )
        })()}

      {/* 히어로 핀 — 누르면 랜딩으로 */}
      {pinned.map((hero) => {
        const p = worldPx(hero.lat!, hero.lng!, zoom)
        return (
          <button
            key={hero.id}
            type="button"
            onClick={() => {
              if (!moved.current) router.push(`/${locale}/s/${hero.id}`)
            }}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
            style={{
              left: `calc(50% + ${p.x - c.x + shift.dx}px)`,
              top: `calc(50% + ${p.y - c.y + shift.dy}px)`,
            }}
          >
            <span className="max-w-28 truncate rounded-pill bg-accent-strong px-2 py-0.5 text-micro text-accent-on shadow-card">
              {hero.name}
            </span>
            <span aria-hidden className="-mt-px h-2 w-2 rotate-45 bg-accent-strong" />
          </button>
        )
      })}

      {/* 줌 컨트롤 */}
      <div className="absolute top-2 right-2 z-20 flex flex-col overflow-hidden rounded-chip border border-line bg-surface shadow-card">
        <button
          type="button"
          aria-label="+"
          onClick={() => setZoom((z) => Math.min(14, z + 1))}
          className="grid h-9 w-9 place-items-center text-content"
        >
          <Plus size={15} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="−"
          onClick={() => setZoom((z) => Math.max(8, z - 1))}
          className="grid h-9 w-9 place-items-center border-t border-line text-content"
        >
          <Minus size={15} aria-hidden />
        </button>
      </div>

      {/* OSM 저작자 표기 — 타일 정책상 필수 */}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-1 bottom-1 z-20 rounded-chip bg-surface/80 px-1.5 py-0.5 text-micro text-content-muted"
      >
        © OpenStreetMap
      </a>
    </div>
  )
}
