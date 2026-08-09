'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'

type ActionResult = { ok: true } | { ok: false; code: 'INVALID' | 'FORBIDDEN' | 'FAILED' }

/**
 * 피드 게시 (FormData: body, photo?, storeId?, authorName?) — 설계사·소상공인·관리자.
 * 소비자 화면에는 쓰기 입구가 없다 — 로컬 정보 공급자는 사업자 쪽이다 (사용자 확정 사양).
 */
export async function createFeedPost(form: FormData): Promise<ActionResult> {
  const body = String(form.get('body') ?? '').trim()
  const photo = form.get('photo') as File | null
  if (!body && (!photo || photo.size === 0)) return { ok: false, code: 'INVALID' }
  if (body.length > 500) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    const role = session.isAdmin ? 'admin' : session.role
    if (role !== 'agent' && role !== 'merchant' && role !== 'admin') {
      return { ok: false, code: 'FORBIDDEN' }
    }

    const db = getAdminDb()
    const ref = db.collection('posts').doc()

    let imageURL: string | null = null
    if (photo && photo.size > 0) {
      imageURL = await uploadToStorage(
        `posts/${session.uid}/${ref.id}.jpg`,
        Buffer.from(await photo.arrayBuffer()),
        photo.type || 'image/jpeg',
      )
    }

    const authorName =
      String(form.get('authorName') ?? '').trim() || session.email?.split('@')[0] || ''

    await ref.set({
      authorUid: session.uid,
      authorName,
      authorRole: role,
      storeId: String(form.get('storeId') ?? '').trim() || null,
      body,
      imageURL,
      visibility: 'public',
      status: 'active',
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[feed] createFeedPost failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
