import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import type { Role } from '@/types/user'

export type AdminUserRow = {
  uid: string
  email: string
  displayName: string
  role: Role | null
  isAdmin: boolean
  createdAt: string | null
}

export type AuditLogRow = {
  id: string
  action: string
  actorEmail: string | null
  targetUid: string
  before: string | null
  after: string | null
  at: string | null
}

function iso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

export async function listUsers(limit = 100): Promise<AdminUserRow[]> {
  const snap = await getAdminDb().collection('users').limit(limit).get()
  return snap.docs.map((doc) => {
    const d = doc.data()
    return {
      uid: doc.id,
      email: (d.email as string) ?? '',
      displayName: (d.displayName as string) ?? '',
      role: (d.role as Role | null) ?? null,
      isAdmin: d.isAdmin === true,
      createdAt: iso(d.createdAt),
    }
  })
}

/** 콘텐츠 관리 행 (사용자 확정 사양) — 상품·게시물·후기·익명글·매장을 한 틀로 다룬다. */
export type AdminContentKind =
  'product' | 'post' | 'review' | 'anonymous' | 'store' | 'board' | 'event'

export type AdminContentRow = {
  id: string
  kind: AdminContentKind
  title: string
  detail: string
  imageURL: string | null
  status: 'active' | 'hidden'
  createdAt: string | null
}

export type AdminContent = {
  products: AdminContentRow[]
  posts: AdminContentRow[]
  reviews: AdminContentRow[]
  anonymous: AdminContentRow[]
  stores: AdminContentRow[]
  board: AdminContentRow[]
  events: AdminContentRow[]
}

function byNewest(a: AdminContentRow, b: AdminContentRow) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
}

/** 올라온 콘텐츠 전부 — 각 컬렉션 최근 50건. 숨김 상태도 보인다 (복원 대상). */
export async function listAdminContent(): Promise<AdminContent> {
  const db = getAdminDb()
  const [productSnap, postSnap, reviewSnap, anonSnap, storeSnap, boardSnap, eventSnap] =
    await Promise.all([
      db.collection('products').limit(50).get(),
      db.collection('posts').limit(50).get(),
      db.collection('reviews').limit(50).get(),
      db.collection('anonymousPosts').limit(50).get(),
      db.collection('stores').limit(50).get(),
      db.collection('boardPosts').limit(50).get(),
      db.collection('events').limit(50).get(),
    ])

  return {
    products: productSnap.docs
      .map((doc): AdminContentRow => {
        const d = doc.data()
        return {
          id: doc.id,
          kind: 'product',
          title: (d.name as string) ?? '',
          detail: `${((d.price as number) ?? 0).toLocaleString()} · ${(d.sellerName as string) || '—'}`,
          imageURL: (d.imageURL as string | null) ?? null,
          status: d.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(d.createdAt),
        }
      })
      .sort(byNewest),
    posts: postSnap.docs
      .map((doc): AdminContentRow => {
        const d = doc.data()
        return {
          id: doc.id,
          kind: 'post',
          title: (d.body as string) || '(사진)',
          detail: (d.authorName as string) ?? '',
          imageURL: (d.imageURL as string | null) ?? null,
          status: d.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(d.createdAt),
        }
      })
      .sort(byNewest),
    reviews: reviewSnap.docs
      .map((doc): AdminContentRow => {
        const d = doc.data()
        return {
          id: doc.id,
          kind: 'review',
          title: (d.body as string) || '(사진)',
          detail: `★${(d.rating as number) ?? 5} · ${(d.authorName as string) ?? ''}`,
          imageURL: (d.photoURL as string | null) ?? null,
          status: d.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(d.createdAt),
        }
      })
      .sort(byNewest),
    anonymous: anonSnap.docs
      .map((doc): AdminContentRow => {
        const d = doc.data()
        return {
          id: doc.id,
          kind: 'anonymous',
          title: (d.body as string) ?? '',
          detail: '',
          imageURL: null,
          status: d.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(d.createdAt),
        }
      })
      .sort(byNewest),
    events: eventSnap.docs
      .map((doc): AdminContentRow => {
        const e = doc.data()
        const stores = Array.isArray(e.stores) ? (e.stores as Array<{ name: string }>) : []
        return {
          id: doc.id,
          kind: 'event',
          title: (e.title as string) ?? '',
          detail: stores.length
            ? stores.map((s) => s.name).join(', ')
            : `${(e.authorName as string) ?? ''}`,
          imageURL: (e.imageURL as string | null) ?? null,
          status: e.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(e.createdAt),
        }
      })
      .sort(byNewest),
    board: boardSnap.docs
      .map((doc): AdminContentRow => {
        const b = doc.data()
        return {
          id: doc.id,
          kind: 'board',
          title: (b.title as string) ?? '',
          detail: `${(b.kind as string) ?? ''} · ${(b.authorName as string) ?? ''}`,
          imageURL: (b.imageURL as string | null) ?? null,
          status: b.status === 'hidden' ? 'hidden' : 'active',
          createdAt: iso(b.createdAt),
        }
      })
      .sort(byNewest),
    stores: storeSnap.docs
      .map((doc): AdminContentRow => {
        const d = doc.data()
        return {
          id: doc.id,
          kind: 'store',
          title: (d.name as string) ?? '',
          detail: (d.tagline as string) ?? '',
          imageURL: (d.heroImageURL as string | null) ?? null,
          status: d.status === 'published' ? 'active' : 'hidden',
          createdAt: iso(d.createdAt),
        }
      })
      .sort(byNewest),
  }
}

export async function listAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  const snap = await getAdminDb().collection('auditLogs').orderBy('at', 'desc').limit(limit).get()
  return snap.docs.map((doc) => {
    const d = doc.data()
    return {
      id: doc.id,
      action: (d.action as string) ?? '',
      actorEmail: (d.actorEmail as string | null) ?? null,
      targetUid: (d.targetUid as string) ?? '',
      before: (d.before as string | null) ?? null,
      after: (d.after as string | null) ?? null,
      at: iso(d.at),
    }
  })
}
