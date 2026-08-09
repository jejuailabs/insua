'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { generateStoreSeoCopy } from '@/lib/ai/openai'
import { getAdminDb } from '@/lib/firebase/admin'

type ActionResult = { ok: true } | { ok: false; code: 'FORBIDDEN' | 'INVALID' | 'FAILED' }

/**
 * 랜딩 SEO 카피 재발행 (사용자 확정 사양).
 * 히어로 카드를 만들 때 함께 발행되지만, 그 전에 만들어진 매장이나
 * 정보가 바뀐 매장을 위해 다시 돌릴 수 있어야 한다.
 * 권한: 그 매장을 만든 설계사·소유자 또는 관리자.
 */
export async function regenerateStoreSeo(storeId: string): Promise<ActionResult> {
  if (!storeId) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    const db = getAdminDb()
    const ref = db.collection('stores').doc(storeId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, code: 'INVALID' }

    const d = snap.data()!
    const owns = d.ownerAgentId === session.uid || d.createdByAgentId === session.uid
    if (!owns && !session.isAdmin) return { ok: false, code: 'FORBIDDEN' }

    const menu = (d.menus as Array<{ name: string; price: number }> | undefined)?.[0]
    const seo = await generateStoreSeoCopy({
      storeName: (d.name as string) ?? '',
      category: (d.category as string) ?? 'etc',
      subCategory: (d.subCategory as string) || undefined,
      address: (d.address as string) ?? '',
      tagline: (d.tagline as string) ?? '',
      menuName: menu?.name ?? '',
      menuPrice: menu?.price ?? 0,
      hours: (d.hours as { open: string; close: string }) ?? { open: '', close: '' },
      ownerNote: (d.intro as string) ?? '',
    })

    await ref.update({ seo, updatedAt: new Date() })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[stores] regenerateStoreSeo failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
