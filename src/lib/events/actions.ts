'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'
import type { EventStore } from '@/lib/events/data'

type ActionResult<T = never> =
  | { ok: true; value?: T }
  | { ok: false; code: 'FORBIDDEN' | 'INVALID' | 'UNAUTHENTICATED' | 'FAILED' }

/**
 * 이벤트 등록 (사용자 확정 사양) — 설계사·관리자만.
 *
 * 매장 연계 토글이 켜져 있으면 매장을 **1개 이상** 골라야 한다.
 * 토글이 꺼져 있으면 매장 없이 저장되고, 그게 곧 광역 이벤트다.
 * 쿠폰은 할인율이 있을 때만 생긴다 — 0 이면 공지형 이벤트.
 */
export async function createEvent(form: FormData): Promise<ActionResult<string>> {
  const title = String(form.get('title') ?? '').trim()
  const linked = form.get('linkStores') === 'on'
  const storeIds = String(form.get('storeIds') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!title || title.length > 80) return { ok: false, code: 'INVALID' }
  // 연계를 켜놓고 아무 매장도 안 고른 상태는 저장하지 않는다 — 의도가 반쯤 남은 데이터다
  if (linked && storeIds.length === 0) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    if (session.role !== 'agent' && !session.isAdmin) return { ok: false, code: 'FORBIDDEN' }

    const db = getAdminDb()
    const ref = db.collection('events').doc()

    // 매장 이름을 함께 저장한다 — 목록에서 매장 문서를 n번 더 읽지 않기 위해서다
    let stores: EventStore[] = []
    if (linked && storeIds.length) {
      const docs = await db.getAll(
        ...storeIds.slice(0, 20).map((id) => db.collection('stores').doc(id)),
      )
      stores = docs
        .filter((doc) => doc.exists)
        .map((doc) => ({ id: doc.id, name: (doc.data()!.name as string) ?? '' }))
    }

    let imageURL: string | null = null
    const photo = form.get('photo') as File | null
    if (photo && photo.size > 0) {
      imageURL = await uploadToStorage(
        `events/${ref.id}.jpg`,
        Buffer.from(await photo.arrayBuffer()),
        photo.type || 'image/jpeg',
      )
    }

    const parseDate = (key: string) => {
      const raw = String(form.get(key) ?? '').trim()
      if (!raw) return null
      const date = new Date(raw)
      return Number.isNaN(date.getTime()) ? null : date
    }

    await ref.set({
      title,
      body: String(form.get('body') ?? '').trim(),
      stores,
      discountRate: Math.min(90, Math.max(0, Number(String(form.get('discountRate') ?? '')) || 0)),
      imageURL,
      startsAt: parseDate('startsAt'),
      endsAt: parseDate('endsAt'),
      authorUid: session.uid,
      authorName: session.email?.split('@')[0] ?? '',
      status: 'active',
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true, value: ref.id }
  } catch (error) {
    console.error('[events] createEvent failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 이벤트 쿠폰 발급 — 연계 매장이 여럿이면 어느 매장에서 쓸지 골라 받는다.
 * 광역 이벤트는 매장이 없으므로 storeId 를 비워 발급한다.
 */
export async function issueEventCoupon(
  eventId: string,
  storeId: string | null,
): Promise<ActionResult<string>> {
  if (!eventId) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    const db = getAdminDb()
    const snap = await db.collection('events').doc(eventId).get()
    if (!snap.exists || snap.data()!.status === 'hidden') return { ok: false, code: 'INVALID' }

    const d = snap.data()!
    const rate = (d.discountRate as number) ?? 0
    if (rate <= 0) return { ok: false, code: 'INVALID' }
    const endsAt = d.endsAt?.toDate?.() as Date | undefined
    if (endsAt && endsAt.getTime() < Date.now()) return { ok: false, code: 'INVALID' }

    // 연계 매장이 있으면 그 중 하나여야 한다 — 목록에 없는 매장으로는 발급하지 않는다
    const stores = (d.stores as EventStore[]) ?? []
    if (stores.length && (!storeId || !stores.some((s) => s.id === storeId))) {
      return { ok: false, code: 'INVALID' }
    }

    const ref = await db.collection('couponIssues').add({
      userUid: session.uid,
      storeId: storeId ?? null,
      eventId,
      rate,
      issuedAt: new Date(),
      usedAt: null,
    })
    return { ok: true, value: ref.id.slice(0, 8).toUpperCase() }
  } catch (error) {
    console.error('[events] issueEventCoupon failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
