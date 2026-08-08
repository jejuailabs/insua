'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { isRole, type Role } from '@/types/user'

type ActionResult = { ok: true } | { ok: false; code: 'INVALID' | 'FAILED' }

/**
 * 역할 변경 (docs/09 §2.2) — 사용자는 스스로 못 바꾸고 어드민만 바꾼다.
 * 모든 변경은 감사 로그에 남는다 (docs/09 §2.9). 로그 없는 어드민 행위는 없다.
 */
export async function adminSetRole(targetUid: string, role: Role | null): Promise<ActionResult> {
  if (!targetUid || (role !== null && !isRole(role))) return { ok: false, code: 'INVALID' }

  try {
    const admin = await requireAdmin()
    const db = getAdminDb()
    const auth = getAdminAuth()

    const before = (await db.collection('users').doc(targetUid).get()).data()?.role ?? null

    const existing = (await auth.getUser(targetUid)).customClaims ?? {}
    await auth.setCustomUserClaims(targetUid, { ...existing, role })
    await db.collection('users').doc(targetUid).update({ role, updatedAt: new Date() })

    await db.collection('auditLogs').add({
      action: 'user.role.change',
      actorUid: admin.uid,
      actorEmail: admin.email,
      targetUid,
      before,
      after: role,
      at: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[admin] adminSetRole failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
