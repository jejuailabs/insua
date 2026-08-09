import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

/**
 * 실시간 로컬 피드 (사용자 확정 사양) — 설계사·소상공인이 올린 소식이
 * 메인의 SNS 피드로 노출된다. posts 컬렉션 (Rules: public+active 만 공개 read).
 */

export type FeedPost = {
  id: string
  authorName: string
  authorRole: 'agent' | 'merchant' | 'admin'
  storeId: string | null
  body: string
  imageURL: string | null
  minutesAgo: number
}

function toPost(id: string, d: FirebaseFirestore.DocumentData, now: number): FeedPost {
  const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : now
  return {
    id,
    authorName: (d.authorName as string) ?? '',
    authorRole: (d.authorRole as FeedPost['authorRole']) ?? 'merchant',
    storeId: (d.storeId as string | null) ?? null,
    body: (d.body as string) ?? '',
    imageURL: (d.imageURL as string | null) ?? null,
    minutesAgo: Math.max(0, Math.floor((now - created) / 60_000)),
  }
}

/** 공개 피드 — 최신순. orderBy 를 빼고 메모리 정렬한다 (복합 인덱스 불필요, MVP 규모). */
export async function listFeedPosts(limit = 12, offset = 0): Promise<FeedPost[]> {
  const snap = await getAdminDb()
    .collection('posts')
    .where('visibility', '==', 'public')
    .where('status', '==', 'active')
    .limit(120)
    .get()
  const now = Date.now()
  return snap.docs
    .map((doc) => toPost(doc.id, doc.data(), now))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(offset, offset + limit)
}

/** 내가 올린 소식 — 내 매장 화면의 소식 섹션용. */
export async function listMyFeedPosts(uid: string, limit = 20): Promise<FeedPost[]> {
  const snap = await getAdminDb().collection('posts').where('authorUid', '==', uid).limit(40).get()
  const now = Date.now()
  return snap.docs
    .map((doc) => toPost(doc.id, doc.data(), now))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, limit)
}
