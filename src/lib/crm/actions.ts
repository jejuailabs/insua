'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { TIER_CYCLE_DAYS, TIERS, type InteractionType, type Tier } from './types'

type ActionResult = { ok: true; id?: string } | { ok: false; code: 'INVALID' | 'FAILED' }

async function requireAgent() {
  const session = await requireSession()
  if (session.role !== 'agent' && !session.isAdmin) throw new Error('FORBIDDEN')
  return session
}

export type NewContactInput = {
  name: string
  company?: string
  position?: string
  phone?: string
  tier?: Tier
  cycleDays?: number
  note?: string
  photoURL?: string
  consent?: { dataSharing?: boolean; portrait?: boolean; recording?: boolean }
}

/** 신규 고객 등록 (docs/06 §6). 최소 필수는 이름 하나. 동의 3종은 기본 해제. */
export async function createContact(input: NewContactInput): Promise<ActionResult> {
  const name = input.name?.trim()
  if (!name) return { ok: false, code: 'INVALID' }
  const tier: Tier = TIERS.includes(input.tier as Tier) ? (input.tier as Tier) : 'B'
  const cycleDays =
    typeof input.cycleDays === 'number' && input.cycleDays > 0
      ? Math.min(input.cycleDays, 365)
      : TIER_CYCLE_DAYS[tier]

  try {
    const { uid } = await requireAgent()
    const now = new Date()
    const ref = await getAdminDb()
      .collection('contacts')
      .add({
        ownerAgentId: uid,
        name,
        company: input.company?.trim() ?? '',
        position: input.position?.trim() ?? '',
        phone: input.phone?.trim() ?? '',
        tier,
        cycleDays,
        note: input.note?.trim() ?? '',
        photoURL: input.photoURL ?? null,
        website: '',
        // 미리 체크해두지 않는다 (docs/06 §6). 서버에서도 기본 false 를 강제한다.
        consent: {
          dataSharing: input.consent?.dataSharing === true,
          portrait: input.consent?.portrait === true,
          recording: input.consent?.recording === true,
        },
        nextContactDueAt: new Date(now.getTime() + cycleDays * 86_400_000),
        createdAt: now,
        updatedAt: now,
      })
    revalidatePath('/', 'layout')
    return { ok: true, id: ref.id }
  } catch (error) {
    console.error('[crm] createContact failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/** 상담로그 추가. 기록하면 다음 연락 예정일이 주기만큼 뒤로 밀린다. */
export async function addInteraction(
  contactId: string,
  type: InteractionType,
  body: string,
): Promise<ActionResult> {
  const text = body?.trim()
  if (!text || !contactId) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const contactRef = db.collection('contacts').doc(contactId)
    const snap = await contactRef.get()
    if (!snap.exists || snap.data()!.ownerAgentId !== uid) return { ok: false, code: 'FAILED' }

    const now = new Date()
    const cycleDays = (snap.data()!.cycleDays as number) ?? 14
    await contactRef.collection('interactions').add({ type, body: text, createdAt: now })
    await contactRef.update({
      nextContactDueAt: new Date(now.getTime() + cycleDays * 86_400_000),
      updatedAt: now,
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[crm] addInteraction failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
