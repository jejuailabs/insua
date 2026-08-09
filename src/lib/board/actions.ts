'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { isBoardKind } from '@/lib/board/data'
import { uploadToStorage } from '@/lib/stores/data'

type ActionResult = { ok: true } | { ok: false; code: 'FORBIDDEN' | 'INVALID' | 'FAILED' }

/**
 * 커뮤니티 게시판 글쓰기 (사용자 확정 사양).
 * 정부지원·특별대출 정보를 포함해 네 게시판 모두 소상공인·설계사·관리자가 쓸 수 있다.
 * 소비자는 읽기만 — 이 공간은 사장님들의 정보 교환 자리다.
 */
export async function createBoardPost(form: FormData): Promise<ActionResult> {
  const kind = String(form.get('kind') ?? '')
  const title = String(form.get('title') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  if (!isBoardKind(kind) || !title || title.length > 80) return { ok: false, code: 'INVALID' }
  if (body.length > 2000) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    const canWrite =
      session.role === 'merchant' || session.role === 'agent' || session.isAdmin === true
    if (!canWrite) return { ok: false, code: 'FORBIDDEN' }

    const db = getAdminDb()
    const ref = db.collection('boardPosts').doc()

    let imageURL: string | null = null
    const photo = form.get('photo') as File | null
    if (photo && photo.size > 0) {
      imageURL = await uploadToStorage(
        `board/${kind}/${ref.id}.jpg`,
        Buffer.from(await photo.arrayBuffer()),
        photo.type || 'image/jpeg',
      )
    }

    await ref.set({
      kind,
      title,
      body,
      meta: String(form.get('meta') ?? '').trim(),
      sourceUrl: String(form.get('sourceUrl') ?? '').trim(),
      imageURL,
      authorUid: session.uid,
      authorName: session.email?.split('@')[0] ?? '',
      authorRole: session.isAdmin ? 'admin' : (session.role ?? ''),
      status: 'active',
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[board] createBoardPost failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
