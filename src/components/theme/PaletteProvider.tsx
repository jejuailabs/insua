'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import {
  DEFAULT_PALETTE,
  isPaletteId,
  PALETTE_STORAGE_KEY,
  type PaletteId,
} from '@/lib/theme/palette'
import { useIsMounted } from '@/lib/utils/useIsMounted'

type PaletteContextValue = {
  palette: PaletteId
  setPalette: (next: PaletteId) => void
  /** 마운트 전에는 활성 상태를 그리면 안 된다. 서버가 모르는 값이라 하이드레이션이 어긋난다. */
  mounted: boolean
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

/**
 * 첫 페인트의 data-palette 는 <head> 의 PaletteScript 가 이미 붙여놨다.
 * 여기서는 그 값을 읽어오기만 한다 — 다시 쓰면 깜빡인다.
 */
function readPaletteFromDom(): PaletteId {
  if (typeof document === 'undefined') return DEFAULT_PALETTE
  const attr = document.documentElement.getAttribute('data-palette')
  return isPaletteId(attr) ? attr : DEFAULT_PALETTE
}

/**
 * 팔레트는 next-themes 가 관리하지 않으므로(docs/04 §6.2) 직접 들고 있는다.
 * M2 이후 로그인 사용자는 users.palette 와도 동기화한다 (docs/04 §6.1).
 */
export function PaletteProvider({ children }: { children: React.ReactNode }) {
  // 지연 초기화라 클라이언트 첫 렌더부터 실제 팔레트를 들고 시작한다.
  const [palette, setPaletteState] = useState<PaletteId>(readPaletteFromDom)
  const mounted = useIsMounted()

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next)
    document.documentElement.setAttribute('data-palette', next)
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next)
    } catch {
      // 시크릿 모드 등에서 localStorage 가 막힐 수 있다. 이번 세션에만 적용되고 끝난다.
    }
  }, [])

  return (
    <PaletteContext.Provider value={{ palette, setPalette, mounted }}>
      {children}
    </PaletteContext.Provider>
  )
}

export function usePalette() {
  const value = useContext(PaletteContext)
  if (!value) throw new Error('usePalette must be used inside PaletteProvider')
  return value
}
