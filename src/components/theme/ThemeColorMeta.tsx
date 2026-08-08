'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { usePalette } from './PaletteProvider'

/** 스타일시트가 아직 안 붙었을 때를 대비한 재시도. 상한을 둬서 무한 루프를 막는다. */
const MAX_ATTEMPTS = 20
const RETRY_MS = 50

/**
 * 브라우저 크롬 색(<meta name="theme-color">)을 현재 --bg 에 맞춘다 (docs/04 §6.1).
 *
 * metadata.viewport 에 정적으로 박을 수 없다. 8조합마다 값이 달라서
 * hex 리터럴이 토큰 밖으로 새어나가기 때문이다 (CLAUDE.md §3-4).
 * 계산된 값을 읽어 쓰므로 tokens.css 가 항상 단일 출처로 남는다.
 *
 * requestAnimationFrame 을 쓰지 않는다 — 백그라운드 탭에서는 프레임을 그리지 않아
 * 콜백이 아예 실행되지 않는다. getComputedStyle 이 스타일 재계산을 동기로 유발하므로
 * 효과 안에서 바로 읽어도 값이 정확하다.
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme()
  const { palette } = usePalette()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    const apply = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      if (!bg) {
        if (attempts++ < MAX_ATTEMPTS) timer = setTimeout(apply, RETRY_MS)
        return
      }

      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = bg
    }

    apply()
    return () => clearTimeout(timer)
  }, [resolvedTheme, palette])

  return null
}
