'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'

type ActionResult = { ok: true } | { ok: false; code: 'INVALID' | 'FAILED' }

/**
 * 익명글 작성 (docs/07 A-4).
 * authorUid 는 신고 대응·운영 목적으로만 서버에 저장한다. 화면에는 절대 안 나간다.
 * 업장명·주소 자동 마스킹은 실데이터 단계 과제 — 지금은 고지 문구로 대신한다.
 */
export async function createAnonymousPost(body: string): Promise<ActionResult> {
  const text = body?.trim()
  if (!text || text.length > 500) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireSession()
    await getAdminDb().collection('anonymousPosts').add({
      authorUid: uid,
      body: text,
      comments: 0,
      createdAt: new Date(),
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[merchant] createAnonymousPost failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
