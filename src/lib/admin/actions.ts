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

/**
 * 콘텐츠 관리 (사용자 확정 사양) — 올라온 상품·게시물·후기·익명글·매장을
 * 숨김/복원/삭제한다. 숨김은 각 목록 쿼리의 status 필터가 걸러주고, 삭제는 영구다.
 * 후기는 매장 평점 집계를 만든 장본인이라, 상태가 바뀌면 집계도 같이 되돌린다.
 */
const CONTENT_COLLECTIONS = {
  product: 'products',
  post: 'posts',
  review: 'reviews',
  anonymous: 'anonymousPosts',
  store: 'stores',
  board: 'boardPosts',
} as const

export type ContentKind = keyof typeof CONTENT_COLLECTIONS

export async function adminModerateContent(
  kind: ContentKind,
  id: string,
  act: 'hide' | 'restore' | 'delete',
): Promise<ActionResult> {
  if (!CONTENT_COLLECTIONS[kind] || !id) return { ok: false, code: 'INVALID' }

  try {
    const admin = await requireAdmin()
    const db = getAdminDb()
    const ref = db.collection(CONTENT_COLLECTIONS[kind]).doc(id)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, code: 'INVALID' }
    const d = snap.data()!
    const wasActive = kind === 'store' ? d.status === 'published' : d.status !== 'hidden'

    // 후기 집계 역산 — 노출에서 빠지는 순간 평점에서도 빠져야 화면과 숫자가 맞는다
    async function adjustReviewAggregate(direction: 1 | -1) {
      if (kind !== 'review') return
      const storeRef = db.collection('stores').doc(d.storeId as string)
      await db.runTransaction(async (tx) => {
        const storeSnap = await tx.get(storeRef)
        if (!storeSnap.exists) return
        const s = storeSnap.data()!
        const prevCount = (s.ratingCount as number) ?? 0
        const count = Math.max(0, prevCount + direction)
        const prevAvg = (s.rating as number) ?? 0
        const rating = (d.rating as number) ?? 5
        const nextAvg =
          count === 0
            ? 0
            : Math.round(((prevAvg * prevCount + direction * rating) / count) * 10) / 10
        tx.update(storeRef, {
          rating: nextAvg,
          ratingCount: count,
          reviewCount: Math.max(0, ((s.reviewCount as number) ?? 0) + direction),
          updatedAt: new Date(),
        })
      })
    }

    if (act === 'delete') {
      if (wasActive) await adjustReviewAggregate(-1)
      await ref.delete()
    } else if (act === 'hide') {
      if (!wasActive) return { ok: true }
      await ref.update({ status: 'hidden', updatedAt: new Date() })
      await adjustReviewAggregate(-1)
    } else {
      if (wasActive) return { ok: true }
      await ref.update({
        status: kind === 'store' ? 'published' : 'active',
        updatedAt: new Date(),
      })
      await adjustReviewAggregate(1)
    }

    await db.collection('auditLogs').add({
      action: `content.${kind}.${act}`,
      actorUid: admin.uid,
      actorEmail: admin.email,
      targetUid: id,
      before: wasActive ? 'active' : 'hidden',
      after: act === 'delete' ? 'deleted' : act === 'hide' ? 'hidden' : 'active',
      at: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[admin] adminModerateContent failed:', (error as Error).message)
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
