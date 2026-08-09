'use server'

import { getSession, requireSession } from '@/lib/auth/session'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
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
    const db = getAdminDb()
    const ref = db.collection('users').doc(uid)

    // 읽고-쓰는 사이에 끼어드는 중복 요청을 막으려면 트랜잭션이어야 한다.
    const outcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return 'FAILED' as const
      if (snap.data()?.role) return 'ALREADY_SET' as const

      const now = new Date()
      tx.update(ref, { role, onboardedAt: now, updatedAt: now })
      return 'OK' as const
    })

    if (outcome !== 'OK') return { ok: false, code: outcome }

    // 클레임은 트랜잭션 밖이다. Auth 는 Firestore 트랜잭션에 참여하지 않는다.
    const existing = (await getAdminAuth().getUser(uid)).customClaims ?? {}
    await getAdminAuth().setCustomUserClaims(uid, { ...existing, role })

    return { ok: true }
  } catch (error) {
    console.error('[onboarding] setRole failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 로그인 직후 모달이 "역할 선택으로 갈지, 내 화면으로 갈지" 를 정하려면 필요하다.
 * 세션 쿠키를 서버에서 검증해서 읽는다 — 클라이언트가 말하는 역할은 믿지 않는다 (CLAUDE.md §3-2).
 */
export async function getMyRole(): Promise<Role | null> {
  const session = await getSession()
  return session?.role ?? null
}

/** 로그인 직후 분기용 — 어드민은 역할 선택 없이 콘솔로 보낸다. */
export async function getMyAccess(): Promise<{ role: Role | null; isAdmin: boolean }> {
  const session = await getSession()
  return { role: session?.role ?? null, isAdmin: session?.isAdmin === true }
}
