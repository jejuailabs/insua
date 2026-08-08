'use server'

import { requireSession } from '@/lib/auth/session'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { isRole, type Role } from '@/types/user'

export type SetRoleResult = { ok: true } | { ok: false; code: 'ALREADY_SET' | 'FAILED' }

/**
 * 역할 설정 (docs/03 §3).
 *
 * **클라이언트는 users.role 을 직접 쓰지 못한다.** Security Rules 가 막고, 이 액션만 통로다.
 * 한 번 정해지면 사용자가 스스로 못 바꾼다 — 바꾸면 CRM 데이터 소유권이 꼬인다.
 * 변경은 어드민만 가능하다 (docs/09 §2.2).
 */
export async function setRole(role: Role): Promise<SetRoleResult> {
  if (!isRole(role)) return { ok: false, code: 'FAILED' }

  try {
    const { uid } = await requireSession()
    const ref = adminDb.collection('users').doc(uid)

    // 읽고-쓰는 사이에 끼어드는 중복 요청을 막으려면 트랜잭션이어야 한다.
    const outcome = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return 'FAILED' as const
      if (snap.data()?.role) return 'ALREADY_SET' as const

      const now = new Date()
      tx.update(ref, { role, onboardedAt: now, updatedAt: now })
      return 'OK' as const
    })

    if (outcome !== 'OK') return { ok: false, code: outcome }

    // 클레임은 트랜잭션 밖이다. Auth 는 Firestore 트랜잭션에 참여하지 않는다.
    const existing = (await adminAuth.getUser(uid)).customClaims ?? {}
    await adminAuth.setCustomUserClaims(uid, { ...existing, role })

    return { ok: true }
  } catch (error) {
    console.error('[onboarding] setRole failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
