import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

/**
 * 이벤트 (사용자 확정 사양).
 *
 * 설계사·관리자가 올린다. 매장 연계는 **토글**이다:
 * - ON  → 매장을 1개 이상 골라 붙인다. 그 매장들에서 쓰는 쿠폰이 나온다.
 * - OFF → 매장을 붙이지 않는 **광역 이벤트**. 지역 전체에 걸리는 공지·혜택이다.
 *
 * 기간이 지난 이벤트는 목록에서 빠진다 — 끝난 행사가 남아 있으면 그게 거짓말이 된다.
 */

export type EventStore = { id: string; name: string }

export type LocalEvent = {
  id: string
  title: string
  body: string
  imageURL: string | null
  /** 연계 매장. 비어 있으면 광역 이벤트. */
  stores: EventStore[]
  /** 0 이면 쿠폰 없는 공지형 이벤트. */
  discountRate: number
  startsAt: string | null
  endsAt: string | null
  authorName: string
  createdAtMs: number
}

function iso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

function toEvent(id: string, d: FirebaseFirestore.DocumentData): LocalEvent {
  return {
    id,
    title: (d.title as string) ?? '',
    body: (d.body as string) ?? '',
    imageURL: (d.imageURL as string | null) ?? null,
    stores: Array.isArray(d.stores) ? (d.stores as EventStore[]) : [],
    discountRate: (d.discountRate as number) ?? 0,
    startsAt: iso(d.startsAt),
    endsAt: iso(d.endsAt),
    authorName: (d.authorName as string) ?? '',
    createdAtMs: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : 0,
  }
}

/** 진행 중인 이벤트 — 종료일이 지났거나 어드민이 숨긴 건 뺀다. 최신순. */
export async function listEvents(limit = 30): Promise<LocalEvent[]> {
  const snap = await getAdminDb().collection('events').limit(60).get()
  const now = Date.now()
  return snap.docs
    .filter((doc) => doc.data().status !== 'hidden')
    .map((doc) => toEvent(doc.id, doc.data()))
    .filter((e) => !e.endsAt || new Date(e.endsAt).getTime() >= now)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, limit)
}

/** 이벤트 등록 폼의 매장 선택지 — 공개된 실매장만. */
export async function listSelectableStores(): Promise<EventStore[]> {
  const snap = await getAdminDb()
    .collection('stores')
    .where('isPublic', '==', true)
    .where('status', '==', 'published')
    .limit(100)
    .get()
  return snap.docs
    .map((doc) => ({ id: doc.id, name: (doc.data().name as string) ?? '' }))
    .filter((s) => s.name)
}
