/**
 * 방문 횟수 → 단골 등급 (사용자 확정 사양) — 순수 함수라 클라이언트에서도 쓴다.
 * 집계는 서버(visits.ts)가, 표현은 클라이언트가 맡는다.
 */

export type VisitTier = 'bronze' | 'silver' | 'gold'

/** 1회부터 동, 3회 은, 5회 금 — 많아질수록 강조가 세진다. */
export function visitTierOf(count: number): VisitTier | null {
  if (count >= 5) return 'gold'
  if (count >= 3) return 'silver'
  if (count >= 1) return 'bronze'
  return null
}

/** 등급별 카드 테두리 글로우 — 색은 토큰만 쓴다 (docs/04). */
export const VISIT_GLOW: Record<VisitTier, string> = {
  bronze: '0 0 0 2px var(--visit-bronze), 0 0 10px var(--visit-bronze)',
  silver: '0 0 0 2px var(--visit-silver), 0 0 14px var(--visit-silver)',
  gold: '0 0 0 3px var(--visit-gold), 0 0 20px var(--visit-gold)',
}
