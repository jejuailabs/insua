'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * 반경 필터 (docs/08 §5).
 * 위치 권한은 **첫 진입 시가 아니라 칩을 누를 때** 요청한다 — 진입 즉시 팝업은 이탈률만 높인다.
 * 거부하면 지역 선택 드롭다운으로 폴백한다. geohash 쿼리는 실데이터 단계에서 붙는다.
 */
export function RadiusChips({
  onChange,
  onLocated,
}: {
  /** 반경 변경 콜백 — 반경별 노출 캡(1km 15 / 3km 30 / 5km 50)에 쓴다. */
  onChange?: (km: number) => void
  /** 위치 확보 콜백 — 거리순 정렬에 쓴다. */
  onLocated?: (pos: { lat: number; lng: number }) => void
} = {}) {
  const t = useTranslations('consumer')
  const [radius, setRadius] = useState(3)
  const [denied, setDenied] = useState(false)
  const [region, setRegion] = useState('all')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function pick(km: number) {
    if (!('geolocation' in navigator)) {
      setDenied(true)
      showToast(t('locationDenied'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDenied(false)
        setRadius(km)
        onChange?.(km)
        onLocated?.({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        showToast(t('radiusApplied', { km }))
      },
      () => {
        setDenied(true)
        showToast(t('locationDenied'))
      },
      { timeout: 5000 },
    )
  }

  return (
    // 세그먼트 컨트롤 — 카테고리 칩과 한 줄에 서므로, 낱개 칩이 아니라
    // 하나로 묶인 덩어리로 보여야 "거리"와 "업종"이 다른 축임이 읽힌다.
    <div className="flex items-center gap-1.5">
      <div className="flex shrink-0 items-center overflow-hidden rounded-pill border border-line">
        {[1, 3, 5].map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => pick(km)}
            aria-label={t('radius', { km })}
            aria-pressed={km === radius && !denied}
            className={cn(
              'tabular border-line px-2.5 py-1 text-micro not-first:border-l',
              km === radius && !denied ? 'bg-accent-soft text-accent-strong' : 'text-content-muted',
            )}
          >
            {km}km
          </button>
        ))}
      </div>

      {denied && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t('regionAll')}
          className="min-h-7 rounded-chip border border-line bg-surface px-1.5 text-micro text-content"
        >
          <option value="all">{t('regionAll')}</option>
          <option value="jeju">{t('regionJeju')}</option>
          <option value="seogwipo">{t('regionSeogwipo')}</option>
        </select>
      )}

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </div>
  )
}
