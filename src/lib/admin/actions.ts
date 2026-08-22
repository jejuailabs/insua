'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { isRole, type Role } from '@/types/user'

type ActionResult = { ok: true } | { ok: false; code: 'INVALID' | 'FAILED' }

/**
 * 후기 노출 변화에 맞춰 매장 평점 집계를 되돌린다.
 * 후기를 숨기거나 지우면서 이걸 빼먹으면 화면의 별점과 후기 수가 서로 어긋난다.
 * 회원 삭제에서도 같은 계산이 필요해 모듈 스코프로 올려 공유한다.
 */
async function adjustStoreReviewAggregate(
  db: FirebaseFirestore.Firestore,
  review: FirebaseFirestore.DocumentData,
  direction: 1 | -1,
) {
  const storeId = review.storeId as string | undefined
  if (!storeId) return

  const storeRef = db.collection('stores').doc(storeId)
  await db.runTransaction(async (tx) => {
    const storeSnap = await tx.get(storeRef)
    if (!storeSnap.exists) return
    const s = storeSnap.data()!
    const prevCount = (s.ratingCount as number) ?? 0
    const count = Math.max(0, prevCount + direction)
    const prevAvg = (s.rating as number) ?? 0
    const rating = (review.rating as number) ?? 5
    const nextAvg =
      count === 0 ? 0 : Math.round(((prevAvg * prevCount + direction * rating) / count) * 10) / 10
    tx.update(storeRef, {
      rating: nextAvg,
      ratingCount: count,
      reviewCount: Math.max(0, ((s.reviewCount as number) ?? 0) + direction),
      updatedAt: new Date(),
    })
  })
}

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

    // 자기 자신만 막는 걸로는 부족하다 — 다른 관리자가 마지막 한 명을 내려도 잠긴다.
    if (!makeAdmin && existing.admin === true && (await countRealAdmins(db, auth)) <= 1) {
      return { ok: false, code: 'INVALID' }
    }
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
      await adjustStoreReviewAggregate(db, d, direction)
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

/* ────────────────────────────────────────────────────────────────────────────
 * 회원 삭제 (완전 탈퇴)
 * ──────────────────────────────────────────────────────────────────────────── */

export type DeleteSummary = {
  /** 지운 것 — 개인정보 */
  contacts: number
  couponIssues: number
  /** 숨긴 것 — 공개 콘텐츠 */
  posts: number
  products: number
  reviews: number
  boardPosts: number
  events: number
  stores: number
  /** 끊은 것 — 참조 */
  anonymousScrubbed: number
  agentRefsCleared: number
}

export type DeleteUserResult =
  | { ok: true; summary: DeleteSummary }
  | { ok: false; code: 'INVALID' | 'SELF' | 'LAST_ADMIN' | 'FAILED' }

/** 쿼리를 페이지로 나눠 훑는다. 한 번에 다 읽으면 데이터가 많은 회원에서 터진다. */
async function eachDoc(
  base: FirebaseFirestore.Query,
  handle: (doc: FirebaseFirestore.QueryDocumentSnapshot) => Promise<void>,
): Promise<number> {
  const PAGE = 300
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined
  let total = 0

  for (;;) {
    let q = base.orderBy('__name__').limit(PAGE)
    if (last) q = q.startAfter(last)
    const snap = await q.get()
    if (snap.empty) return total

    for (const doc of snap.docs) {
      await handle(doc)
      total++
    }
    if (snap.size < PAGE) return total
    last = snap.docs[snap.size - 1]
  }
}

/**
 * 실제 관리자 수.
 *
 * `users.isAdmin` 은 표시용 미러라 그것만 세면 **과다 집계**될 수 있다 (docs/03 §4.1).
 * 미러는 후보 목록으로만 쓰고 판정은 커스텀 클레임으로 한다 — 마지막 관리자를 지워
 * 시스템이 잠기는 사고는, 과소 집계(=더 막음)보다 과다 집계(=덜 막음)가 위험하다.
 */
async function countRealAdmins(
  db: FirebaseFirestore.Firestore,
  auth: ReturnType<typeof getAdminAuth>,
): Promise<number> {
  const snap = await db.collection('users').where('isAdmin', '==', true).limit(50).get()
  let count = 0
  for (const doc of snap.docs) {
    try {
      if ((await auth.getUser(doc.id)).customClaims?.admin === true) count++
    } catch {
      // Auth 계정이 없는데 미러만 남은 경우. 관리자로 세지 않는다.
    }
  }
  return count
}

/**
 * 회원 삭제 (완전 탈퇴) — 해당 지메일로 **다시 처음처럼 가입**할 수 있게 만든다.
 *
 * 재가입이 되려면 Firestore 문서만 지워선 안 된다. **Firebase Auth 계정을 지워야**
 * 다음 로그인에서 새 uid 가 발급되고 `/api/session` 이 users 문서를 새로 만든다.
 * Auth 계정을 남긴 채 문서만 지우면 같은 uid 로 되살아나 "새 가입"이 아니게 된다.
 *
 * docs/02 §0 의 소프트 삭제 원칙(`deletedAt`)에 대한 **의도된 예외**다.
 * 그 원칙은 신고 대응을 위해 콘텐츠를 남기려는 것이고, 이건 계정 자체를 없애는 탈퇴 처리다.
 *
 * 남은 데이터는 성격에 따라 셋으로 갈라 처리한다 (docs/09 §2.2):
 *
 * - **개인정보는 지운다** (`contacts` + 상담로그, `couponIssues`).
 *   소유자가 사라지면 Rules 상 아무도 못 읽는다. 읽지도 지우지도 못하는 PII 를
 *   남기는 게 가장 나쁜 결과다.
 * - **공개 콘텐츠는 숨긴다** (`posts` `products` `reviews` `boardPosts` `events` `stores`).
 *   지우면 되돌릴 수 없다. 노출만 멈추고 판단은 콘텐츠 관리에 맡긴다.
 * - **참조는 끊는다** (`anonymousPosts.authorUid`, `users.agentId`).
 *   없는 계정을 가리키는 링크는 추적 리스크이자 오작동의 원인이다.
 */
export async function adminDeleteUser(targetUid: string): Promise<DeleteUserResult> {
  if (!targetUid) return { ok: false, code: 'INVALID' }

  try {
    const admin = await requireAdmin()
    // 자기 자신은 지울 수 없다.
    if (targetUid === admin.uid) return { ok: false, code: 'SELF' }

    const db = getAdminDb()
    const auth = getAdminAuth()

    // 마지막 관리자는 남긴다. 관리자가 0명이 되면 아무도 되돌릴 수 없다.
    let targetIsAdmin = false
    try {
      targetIsAdmin = (await auth.getUser(targetUid)).customClaims?.admin === true
    } catch {
      // Auth 계정이 이미 없으면 관리자일 수 없다.
    }
    if (targetIsAdmin && (await countRealAdmins(db, auth)) <= 1) {
      return { ok: false, code: 'LAST_ADMIN' }
    }

    const userRef = db.collection('users').doc(targetUid)
    const before = (await userRef.get()).data() ?? null
    const now = new Date()
    const hide = { status: 'hidden', updatedAt: now }

    // ── 1) 개인정보: 삭제 ──────────────────────────────────────────────
    // 고객카드에는 전화·메모·녹음까지 든 제3자 PII 가 있다. 소유자가 사라지면
    // Rules(`ownerAgentId == uid`)상 누구도 못 읽으므로 상담로그까지 함께 지운다.
    const contacts = await eachDoc(
      db.collection('contacts').where('ownerAgentId', '==', targetUid),
      async (doc) => {
        await db.recursiveDelete(doc.ref) // interactions 하위까지
      },
    )

    const couponIssues = await eachDoc(
      db.collection('couponIssues').where('userUid', '==', targetUid),
      async (doc) => {
        await doc.ref.delete()
      },
    )

    // ── 2) 공개 콘텐츠: 숨김 ───────────────────────────────────────────
    const posts = await eachDoc(
      db.collection('posts').where('authorUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update(hide)
      },
    )
    const products = await eachDoc(
      db.collection('products').where('sellerUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update(hide)
      },
    )
    const boardPosts = await eachDoc(
      db.collection('boardPosts').where('authorUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update(hide)
      },
    )
    const events = await eachDoc(
      db.collection('events').where('authorUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update(hide)
      },
    )

    // 후기는 매장 평점 집계를 만든 장본인이라, 숨기면 집계도 되돌려야
    // 화면의 별점과 숫자가 어긋나지 않는다.
    const reviews = await eachDoc(
      db.collection('reviews').where('uid', '==', targetUid),
      async (doc) => {
        if (doc.data().status === 'hidden') return
        await doc.ref.update(hide)
        await adjustStoreReviewAggregate(db, doc.data(), -1)
      },
    )

    // 매장은 status 체계가 다르다 — 공개 플래그까지 내려야 실제로 안 보인다.
    const stores = await eachDoc(
      db.collection('stores').where('ownerUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update({ status: 'suspended', isPublic: false, updatedAt: now })
      },
    )

    // ── 3) 참조: 끊기 ─────────────────────────────────────────────────
    // 익명글은 커뮤니티 자산이라 남기되, 없는 계정을 가리키는 작성자 링크는 지운다.
    // 계정이 사라진 뒤의 역추적은 의미가 없고 보관 자체가 리스크다 (docs/02 §5).
    const anonymousScrubbed = await eachDoc(
      db.collection('anonymousPosts').where('authorUid', '==', targetUid),
      async (doc) => {
        await doc.ref.update({ authorUid: null, authorDeletedAt: now })
      },
    )

    // 이 설계사를 담당으로 지정해 둔 사용자들. 안 끊으면 없는 설계사를 가리킨 채
    // AI 툴 게이트가 계속 통과된다 (docs/10 §5).
    const agentRefsCleared = await eachDoc(
      db.collection('users').where('agentId', '==', targetUid),
      async (doc) => {
        await doc.ref.update({ agentId: null, updatedAt: now })
      },
    )

    // ── 4) 계정 삭제 ──────────────────────────────────────────────────
    await db.recursiveDelete(userRef) // 하위 컬렉션(찜 등)까지
    try {
      await auth.deleteUser(targetUid)
    } catch (error) {
      // 이미 없는 계정이면(수동 삭제 등) 무시하고 진행한다.
      if ((error as { code?: string }).code !== 'auth/user-not-found') throw error
    }

    const summary: DeleteSummary = {
      contacts,
      couponIssues,
      posts,
      products,
      reviews,
      boardPosts,
      events,
      stores,
      anonymousScrubbed,
      agentRefsCleared,
    }

    // ── 5) 감사 로그 ──────────────────────────────────────────────────
    // 계정을 지워도 "누가 언제 무엇을" 지웠는지는 남아야 한다 (docs/09 §2.9).
    // before 에는 식별에 필요한 최소만 넣는다 (docs/12 §6).
    await db.collection('auditLogs').add({
      action: 'user.delete',
      actorUid: admin.uid,
      actorEmail: admin.email,
      targetUid,
      before: before ? `${before.email ?? ''} / ${before.role ?? 'none'}` : null,
      after: `deleted ${JSON.stringify(summary)}`,
      at: now,
    })

    revalidatePath('/', 'layout')
    return { ok: true, summary }
  } catch (error) {
    console.error('[admin] adminDeleteUser failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
