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
/**
 * 관리자 지정/해제 (사용자 확정 사양) — 지정된 어드민은 자동으로 화면별 보기
 * (설계사/소상공인/일반인 모드)를 쓸 수 있다 (guards 의 isAdmin 통과 + AdminPeekBanner).
 * 자기 자신의 권한은 해제할 수 없다 — 마지막 어드민이 잠기는 사고를 막는다.
 */
export async function adminSetAdmin(targetUid: string, makeAdmin: boolean): Promise<ActionResult> {
  if (!targetUid) return { ok: false, code: 'INVALID' }

  try {
    const admin = await requireAdmin()
    if (targetUid === admin.uid && !makeAdmin) return { ok: false, code: 'INVALID' }

    const db = getAdminDb()
    const auth = getAdminAuth()

    const existing = (await auth.getUser(targetUid)).customClaims ?? {}
    await auth.setCustomUserClaims(targetUid, { ...existing, admin: makeAdmin })
    // 문서의 isAdmin 은 표시용 미러 — 판정은 항상 클레임 (docs/03 §4.1)
    await db
      .collection('users')
      .doc(targetUid)
      .update({ isAdmin: makeAdmin, updatedAt: new Date() })

    await db.collection('auditLogs').add({
      action: 'user.admin.change',
      actorUid: admin.uid,
      actorEmail: admin.email,
      targetUid,
      before: String(existing.admin === true),
      after: String(makeAdmin),
      at: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[admin] adminSetAdmin failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

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
