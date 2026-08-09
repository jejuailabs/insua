/** docs/02 §3 contacts — 화면에서 쓰는 직렬화 가능한 형태. */

export type Tier = 'S' | 'A' | 'B' | 'C'

export const TIERS: readonly Tier[] = ['S', 'A', 'B', 'C']

/** 등급별 기본 연락 주기(일) — docs/06 §6. */
export const TIER_CYCLE_DAYS: Record<Tier, number> = { S: 3, A: 7, B: 14, C: 30 }

export type ContactConsent = {
  /** 플랫폼 공개 영역 노출 동의. 꺼져 있으면 소비자 피드에 절대 안 뜬다. */
  dataSharing: boolean
  portrait: boolean
  recording: boolean
}

export type Contact = {
  id: string
  name: string
  company: string
  position: string
  phone: string
  tier: Tier
  note: string
  photoURL: string | null
  website: string
  cycleDays: number
  /** ISO — 서버 Timestamp 를 직렬화한 값 */
  nextContactDueAt: string | null
  consent: ContactConsent
  createdAt: string
  /** 히어로 카드·랜딩이 생성된 매장 id. null 이면 아직 CRM 카드만 있는 상태 */
  storeId: string | null
  /** 매장 정보(storeDraft)가 있어 버튼 한 번으로 카드 생성이 가능한가 */
  hasStoreDraft: boolean
}

export type InteractionType = 'note' | 'call' | 'visit' | 'voice'

export type Interaction = {
  id: string
  type: InteractionType
  body: string
  createdAt: string
  audioUrl?: string | null
  imageUrl?: string | null
  /** 녹음 → [텍스트로 정리] 결과 (마크다운) */
  transcript?: string | null
}

/** 연락 예정일이 며칠 지났나. 음수면 아직 여유. */
export function overdueDays(contact: Contact, now = Date.now()): number {
  if (!contact.nextContactDueAt) return 0
  return Math.floor((now - new Date(contact.nextContactDueAt).getTime()) / 86_400_000)
}
