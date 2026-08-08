'use server'

import { revalidatePath } from 'next/cache'
import { getSession, requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'

type ActionResult<T = undefined> =
  { ok: true; value?: T } | { ok: false; code: 'UNAUTHENTICATED' | 'INVALID' | 'FAILED' }

/** 찜 토글 (docs/08 §8) — users/{uid}/saved/{storeId}. 낙관적 업데이트의 서버 쪽. */
export async function toggleSaveStore(storeId: string): Promise<ActionResult<boolean>> {
  if (!storeId) return { ok: false, code: 'INVALID' }
  const session = await getSession()
  if (!session) return { ok: false, code: 'UNAUTHENTICATED' }

  try {
    const ref = getAdminDb().collection('users').doc(session.uid).collection('saved').doc(storeId)
    const snap = await ref.get()
    if (snap.exists) {
      await ref.delete()
      revalidatePath('/', 'layout')
      return { ok: true, value: false }
    }
    await ref.set({ storeId, savedAt: new Date() })
    revalidatePath('/', 'layout')
    return { ok: true, value: true }
  } catch (error) {
    console.error('[consumer] toggleSaveStore failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/** 쿠폰 발급 (docs/08 §7) — couponIssues 문서 생성. 정산·환급은 구현하지 않는다. */
export async function issueCoupon(storeId: string, rate: number): Promise<ActionResult<string>> {
  if (!storeId || !rate) return { ok: false, code: 'INVALID' }
  const session = await getSession()
  if (!session) return { ok: false, code: 'UNAUTHENTICATED' }

  try {
    const ref = await getAdminDb().collection('couponIssues').add({
      userUid: session.uid,
      storeId,
      rate,
      issuedAt: new Date(),
      usedAt: null,
    })
    // 코드 = 문서 id 앞 8자리. 매장에서 대조하는 용도까지만 (PG 없음).
    return { ok: true, value: ref.id.slice(0, 8).toUpperCase() }
  } catch (error) {
    console.error('[consumer] issueCoupon failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 담당 설계사 지정 (docs/08 §9) — 수익모델의 핵심 연결.
 * 내 정보가 설계사에게 전달됨을 고지하고 동의를 받은 뒤에만 호출된다.
 * users.agentId 는 클라이언트가 못 쓰는 필드라 서버(Admin SDK)가 쓴다 (Rules keepsPrivilegedFields).
 */
export async function setMyAgent(agentCode: string, consented: boolean): Promise<ActionResult> {
  const code = agentCode?.trim()
  if (!code || !consented) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireSession()
    await getAdminDb().collection('users').doc(session.uid).update({
      agentId: code,
      updatedAt: new Date(),
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[consumer] setMyAgent failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/** 마이페이지에서 현재 상태를 읽는다 — 서버 검증 세션 기준. */
export async function getMyConsumerProfile(): Promise<{
  email: string | null
  agentId: string | null
  savedStoreIds: string[]
} | null> {
  const session = await getSession()
  if (!session) return null

  const db = getAdminDb()
  const [userSnap, savedSnap] = await Promise.all([
    db.collection('users').doc(session.uid).get(),
    db.collection('users').doc(session.uid).collection('saved').get(),
  ])

  return {
    email: session.email,
    agentId: (userSnap.data()?.agentId as string | null) ?? null,
    savedStoreIds: savedSnap.docs.map((d) => d.id),
  }
}
