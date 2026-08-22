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
  event: 'events',
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

/**
 * 회원 삭제 (완전 탈퇴) — 해당 지메일로 **다시 처음처럼 가입**할 수 있게 만든다.
 *
 * 재가입이 되려면 Firestore 문서만 지워선 안 된다. **Firebase Auth 계정을 지워야**
 * 다음 로그인에서 새 uid 가 발급되고 `/api/session` 이 users 문서를 새로 만든다.
 * Auth 계정을 남긴 채 문서만 지우면 같은 uid 로 되살아나 "새 가입"이 아니게 된다.
 *
 * docs/02 §0 의 소프트 삭제 원칙(`deletedAt`)에 대한 **의도된 예외**다.
 * 그 원칙은 신고 대응을 위해 콘텐츠를 남기려는 것이고, 이건 계정 자체를 없애는
 * 탈퇴 처리다. 대신 누가·언제·누구를 지웠는지는 감사 로그에 남는다 (docs/09 §2.9).
 *
 * **작성한 콘텐츠는 함께 지우지 않는다.** 설계사의 고객카드까지 연쇄 삭제하면
 * 되돌릴 수 없는 범위가 너무 커진다. 남은 콘텐츠는 콘텐츠 관리에서 따로 처리한다.
 */
export async function adminDeleteUser(targetUid: string): Promise<ActionResult> {
  if (!targetUid) return { ok: false, code: 'INVALID' }

  try {
    const admin = await requireAdmin()
    // 자기 자신은 지울 수 없다 — 마지막 관리자가 스스로를 지워 시스템이 잠기는 걸 막는다.
    if (targetUid === admin.uid) return { ok: false, code: 'INVALID' }

    const db = getAdminDb()
    const auth = getAdminAuth()

    const userRef = db.collection('users').doc(targetUid)
    const before = (await userRef.get()).data() ?? null

    // 1) 하위 컬렉션(찜 등)까지 지운다. 문서만 지우면 서브컬렉션이 유령으로 남는다.
    await db.recursiveDelete(userRef)

    // 2) Auth 계정 삭제 — 이게 있어야 같은 지메일로 새로 가입된다.
    //    이미 없는 계정이면(수동 삭제 등) 무시하고 진행한다.
    try {
      await auth.deleteUser(targetUid)
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/user-not-found') throw error
    }

    // 3) 감사 로그. 계정을 지워도 "누가 지웠는지"는 남아야 한다.
    //    본문·개인정보를 통째로 넣지 않고 식별에 필요한 최소만 남긴다 (docs/12 §6).
    await db.collection('auditLogs').add({
      action: 'user.delete',
      actorUid: admin.uid,
      actorEmail: admin.email,
      targetUid,
      before: before ? `${before.email ?? ''} / ${before.role ?? 'none'}` : null,
      after: 'deleted',
      at: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[admin] adminDeleteUser failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
