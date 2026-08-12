/**
 * AI 툴 유·무료 게이트 (docs/10 §5).
 *
 * AI 기능 자체가 아니라 **비즈니스 구조**다. 담당 설계사(`users.agentId`)가 있으면 무료,
 * 없으면 유료 안내 — 이게 제안서가 말한 "AI 툴을 미끼로 한 설계사 신규 고객 확보 채널"이다.
 *
 * ⚠️ 설계사 지정은 **개인정보가 이동하는 행위**다. 화면에서 반드시 명시적으로 고지하고
 * 동의를 받아야 한다. "지정하면 내 연락처와 업장 정보가 해당 설계사에게 전달됩니다"를
 * 흐리게 쓰지 말 것 (docs/10 §5).
 */
export type AiGateReason = 'agent' | 'admin' | 'none'

export type AiGate = {
  allowed: boolean
  reason: AiGateReason
}

export function canUseAiTools(user: { agentId?: string | null; isAdmin?: boolean | null }): AiGate {
  // 운영자는 점검을 위해 통과시킨다. 어드민 화면에 상시 배너가 떠 있어 오인할 여지가 없다.
  if (user.isAdmin) return { allowed: true, reason: 'admin' }
  if (user.agentId) return { allowed: true, reason: 'agent' }
  return { allowed: false, reason: 'none' }
}

/** 게이트가 막혔을 때 화면에 띄울 안내 문구의 i18n 키 (docs/10 §5). */
export const AI_GATE_MESSAGE_KEY: Record<AiGateReason, string | null> = {
  agent: 'aiTools.freeWithAgent',
  admin: null,
  none: 'aiTools.paidWithoutAgent',
}
