import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

/** 방문 후기 (사용자 확정 사양) — 랜딩페이지에 사진과 함께 노출. 서버 전용 접근. */

export type ReviewView = {
  id: string
  authorName: string
  rating: number
  body: string
  photoURL: string | null
  minutesAgo: number
}

export async function listReviews(storeId: string, limit = 12): Promise<ReviewView[]> {
  const snap = await getAdminDb()
    .collection('reviews')
    .where('storeId', '==', storeId)
    .limit(60)
    .get()
  const now = Date.now()
  return snap.docs
    .map((doc) => {
      const d = doc.data()
      const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : now
      return {
        id: doc.id,
        authorName: (d.authorName as string) ?? '',
        rating: (d.rating as number) ?? 5,
        body: (d.body as string) ?? '',
        photoURL: (d.photoURL as string | null) ?? null,
        minutesAgo: Math.max(0, Math.floor((now - created) / 60_000)),
      }
    })
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, limit)
}
