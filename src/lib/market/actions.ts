'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'

type ActionResult =
  { ok: true; id?: string } | { ok: false; code: 'INVALID' | 'FORBIDDEN' | 'FAILED' }

/** 상품 등록 (FormData) — 설계사·소상공인·관리자 (사용자 확정 사양). */
export async function createProduct(form: FormData): Promise<ActionResult> {
  const name = String(form.get('name') ?? '').trim()
  const price = Number(String(form.get('price') ?? '')) || 0
  const photo = form.get('photo') as File | null
  if (!name || price <= 0 || !photo || photo.size === 0) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    if (session.role !== 'agent' && session.role !== 'merchant' && !session.isAdmin)
      return { ok: false, code: 'FORBIDDEN' }

    const db = getAdminDb()
    const ref = db.collection('products').doc()
    const imageURL = await uploadToStorage(
      `products/${ref.id}/photo-${Date.now()}.jpg`,
      Buffer.from(await photo.arrayBuffer()),
      photo.type || 'image/jpeg',
    )

    // 배달 정보는 '표기'까지다 — 배차·정산이 붙는 배달 플랫폼은 스코프 밖 (CLAUDE.md §1)
    const deliveryAvailable = form.get('deliveryAvailable') === 'on'
    const deliveryFee = deliveryAvailable
      ? Math.max(0, Number(String(form.get('deliveryFee') ?? '')) || 0)
      : 0

    await ref.set({
      name,
      price,
      sub: String(form.get('sub') ?? '').trim(),
      desc: String(form.get('desc') ?? '').trim(),
      imageURL,
      sellerUid: session.uid,
      sellerName: session.email ?? '',
      phone: String(form.get('phone') ?? '').trim(),
      pickupPlace: String(form.get('pickupPlace') ?? '').trim(),
      deliveryAvailable,
      deliveryFee,
      best: false,
      status: 'active',
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true, id: ref.id }
  } catch (error) {
    console.error('[market] createProduct failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
