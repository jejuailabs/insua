import type { Timestamp } from 'firebase/firestore'
import type { Locale } from '@/lib/i18n/routing'
import type { PaletteId } from '@/lib/theme/palette'

/** docs/02 §1. 이 파일은 문서와 1:1 로 유지한다. */
export type Role = 'agent' | 'merchant' | 'consumer'

export const ROLES: readonly Role[] = ['agent', 'merchant', 'consumer']

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  /** 온보딩 전에는 null */
  role: Role | null
  /** 표시용 미러. 실제 권한 판정은 커스텀 클레임으로 한다 (docs/03 §4.1) */
  isAdmin: boolean
  locale: Locale
  themePreference: 'light' | 'dark' | 'system'
  palette: PaletteId
  region: { sido: string; sigungu: string } | null
  /** merchant/consumer 가 담당 설계사를 지명한 경우. 수익모델의 핵심 (docs/02 §1) */
  agentId: string | null
  onboardedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null
}

/** 역할별 홈 경로 (docs/03 §1). locale 접두사는 붙이지 않는다 — i18n Link/redirect 가 붙인다. */
export const ROLE_HOME: Record<Role, string> = {
  agent: '/crm',
  merchant: '/home',
  consumer: '/feed',
}
