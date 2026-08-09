import 'server-only'

import { getAdminDb } from '@/lib/firebase/admin'

/**
 * 방문이력 → 단골 등급 (사용자 확정 사양).
 * 실제 방문의 증거가 되는 두 가지만 센다: 내가 남긴 방문 후기 + 사용 처리된 쿠폰.
 * 발급만 하고 안 쓴 쿠폰은 방문이 아니므로 세지 않는다.
 */

/** 매장별 방문 횟수. { storeId: count } — 방문 없는 매장은 키가 없다. */
export async function getVisitCounts(uid: string): Promise<Record<string, number>> {
  const db = getAdminDb()
  const [reviewSnap, couponSnap] = await Promise.all([
    db.collection('reviews').where('uid', '==', uid).limit(300).get(),
    db.collection('couponIssues').where('userUid', '==', uid).limit(300).get(),
  ])

  const counts: Record<string, number> = {}
  for (const doc of reviewSnap.docs) {
    const storeId = doc.data().storeId as string
    if (storeId) counts[storeId] = (counts[storeId] ?? 0) + 1
  }
  for (const doc of couponSnap.docs) {
    const d = doc.data()
    const storeId = d.storeId as string
    if (storeId && d.usedAt != null) counts[storeId] = (counts[storeId] ?? 0) + 1
  }
  return counts
}
