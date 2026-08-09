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
export type AdminContentKind = 'product' | 'post' | 'review' | 'anonymous' | 'store'

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
}

function byNewest(a: AdminContentRow, b: AdminContentRow) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
}

/** 올라온 콘텐츠 전부 — 각 컬렉션 최근 50건. 숨김 상태도 보인다 (복원 대상). */
export async function listAdminContent(): Promise<AdminContent> {
  const db = getAdminDb()
  const [productSnap, postSnap, reviewSnap, anonSnap, storeSnap] = await Promise.all([
    db.collection('products').limit(50).get(),
    db.collection('posts').limit(50).get(),
    db.collection('reviews').limit(50).get(),
    db.collection('anonymousPosts').limit(50).get(),
    db.collection('stores').limit(50).get(),
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
