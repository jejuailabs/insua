import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

export type AnonymousPostView = {
  id: string
  title: string
  minutesAgo: number
  comments: number
}

/**
 * 익명방 목록 (docs/07 A-4, docs/02 §5).
 * authorUid 가 든 원본은 클라이언트가 못 읽는다 (Rules 에서 read: false).
 * 서버가 Admin SDK 로 읽어 **작성자 필드를 걸러낸 뷰**만 내려준다.
 */
export async function listAnonymousPosts(limit = 30): Promise<AnonymousPostView[]> {
  const snap = await getAdminDb()
    .collection('anonymousPosts')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  const now = Date.now()
  return snap.docs.map((doc) => {
    const d = doc.data()
    const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : now
    return {
      id: doc.id,
      title: (d.body as string) ?? '',
      minutesAgo: Math.max(0, Math.floor((now - created) / 60_000)),
      comments: (d.comments as number) ?? 0,
    }
  })
}

/** 최근 24시간 작성자 수 — "지금 n명이 이야기 중" 대체 지표 (docs/07 A-4). 숫자를 지어내지 않는다. */
export async function countRecentAuthors(): Promise<number> {
  const since = Timestamp.fromMillis(Date.now() - 24 * 3600_000)
  const snap = await getAdminDb().collection('anonymousPosts').where('createdAt', '>=', since).get()
  return new Set(snap.docs.map((doc) => doc.data().authorUid as string)).size
}
