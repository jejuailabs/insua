'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'

type ActionResult = { ok: true } | { ok: false; code: 'UNAUTHENTICATED' | 'INVALID' | 'FAILED' }

/**
 * 방문 후기 작성 (사용자 확정 사양) — 로그인 사용자, 사진+텍스트+별점.
 * 실매장(stores 문서)이면 평점 집계(rating/ratingCount/reviewCount)도 갱신한다.
 */
export async function createReview(form: FormData): Promise<ActionResult> {
  const storeId = String(form.get('storeId') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  const rating = Math.min(5, Math.max(1, Number(form.get('rating')) || 5))
  const photo = form.get('photo') as File | null
  if (!storeId || (!body && (!photo || photo.size === 0))) return { ok: false, code: 'INVALID' }
  if (body.length > 500) return { ok: false, code: 'INVALID' }

  const session = await getSession()
  if (!session) return { ok: false, code: 'UNAUTHENTICATED' }

  try {
    const db = getAdminDb()
    const ref = db.collection('reviews').doc()

    let photoURL: string | null = null
    if (photo && photo.size > 0) {
      photoURL = await uploadToStorage(
        `reviews/${storeId}/${ref.id}.jpg`,
        Buffer.from(await photo.arrayBuffer()),
        photo.type || 'image/jpeg',
      )
    }

    await ref.set({
      storeId,
      uid: session.uid,
      authorName: session.email?.split('@')[0] ?? '',
      rating,
      body,
      photoURL,
      createdAt: new Date(),
    })

    // 실매장이면 평점 집계 갱신 — 목데이터 매장은 문서가 없어 건너뛴다
    const storeRef = db.collection('stores').doc(storeId)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(storeRef)
      if (!snap.exists) return
      const d = snap.data()!
      const count = ((d.ratingCount as number) ?? 0) + 1
      const prevAvg = (d.rating as number) ?? 0
      const nextAvg = Math.round(((prevAvg * (count - 1) + rating) / count) * 10) / 10
      tx.update(storeRef, {
        rating: nextAvg,
        ratingCount: count,
        reviewCount: ((d.reviewCount as number) ?? 0) + 1,
        updatedAt: new Date(),
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[reviews] createReview failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
