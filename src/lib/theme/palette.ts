/**
 * 팔레트 정의 (docs/04 §2.2). 실제 색값은 src/styles/tokens.css 에 있다.
 * 여기에는 식별자만 둔다 — 색을 TS 로 들고 오는 순간 토큰이 두 군데로 갈라진다.
 */
export const PALETTES = ['basalt', 'gyul', 'gotjawal', 'badang'] as const

export type PaletteId = (typeof PALETTES)[number]

export const DEFAULT_PALETTE: PaletteId = 'basalt'

/** localStorage 키. FOUC 방지 인라인 스크립트와 반드시 같은 값을 써야 한다. */
export const PALETTE_STORAGE_KEY = 'palette'

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && (PALETTES as readonly string[]).includes(value)
}
