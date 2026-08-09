'use server'

import { revalidatePath } from 'next/cache'
import { generateHeroImage } from '@/lib/ai/openai'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'
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

/**
 * 신규 고객 등록 v2 — 사진·매장 정보 포함 (FormData).
 *
 * 파이프라인 (사용자 확정 사양, 2026-08-09):
 * 1. 고객카드 생성 + 사진·매장 정보(storeDraft) 저장 — 항상
 * 2. `dataSharing` 동의 + 매장 정보가 있으면 → gpt-image-2(low) 로 히어로 이미지 합성
 *    → stores 문서 published → 메인 캐러셀·랜딩(/s/{id}) 자동 노출
 * 3. 미동의면 CRM 카드까지만. 나중에 동의받고 [히어로 카드 만들기] 버튼 하나로 2번 실행
 */
export async function createContactWithCard(
  form: FormData,
): Promise<ActionResult & { storeId?: string }> {
  const name = String(form.get('name') ?? '').trim()
  if (!name) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const now = new Date()
    const tier: Tier = TIERS.includes(form.get('tier') as Tier) ? (form.get('tier') as Tier) : 'B'
    const cycleDays = TIER_CYCLE_DAYS[tier]
    const str = (key: string) => String(form.get(key) ?? '').trim()
    const consent = {
      dataSharing: form.get('consentShare') === 'on',
      portrait: form.get('consentPortrait') === 'on',
      recording: form.get('consentRecording') === 'on',
    }

    const ref = db.collection('contacts').doc()

    // 사진 업로드 (있을 때만) — 서버 업로드라 클라이언트 인증 상태와 무관하다
    const ownerPhoto = form.get('ownerPhoto') as File | null
    const menuPhoto = form.get('menuPhoto') as File | null
    let photoURL: string | null = null
    let menuPhotoURL: string | null = null
    if (ownerPhoto && ownerPhoto.size > 0) {
      photoURL = await uploadToStorage(
        `crm/${uid}/${ref.id}/owner-${Date.now()}.jpg`,
        Buffer.from(await ownerPhoto.arrayBuffer()),
        ownerPhoto.type || 'image/jpeg',
      )
    }
    if (menuPhoto && menuPhoto.size > 0) {
      menuPhotoURL = await uploadToStorage(
        `crm/${uid}/${ref.id}/menu-${Date.now()}.jpg`,
        Buffer.from(await menuPhoto.arrayBuffer()),
        menuPhoto.type || 'image/jpeg',
      )
    }

    const storeDraft = {
      name: str('storeName'),
      tagline: str('storeTagline'),
      category: str('storeCategory') || 'restaurant',
      address: str('storeAddress'),
      hours: { open: str('storeOpen') || '09:00', close: str('storeClose') || '18:00' },
      sns: str('sns'),
      menuName: str('menuName'),
      menuPrice: Number(str('menuPrice')) || 0,
      menuPhotoURL,
    }

    await ref.set({
      ownerAgentId: uid,
      name,
      company: storeDraft.name || str('company'),
      position: str('position'),
      phone: str('phone'),
      tier,
      cycleDays,
      note: str('note'),
      photoURL,
      website: '',
      sns: storeDraft.sns,
      consent,
      storeDraft,
      storeId: null,
      nextContactDueAt: new Date(now.getTime() + cycleDays * 86_400_000),
      createdAt: now,
      updatedAt: now,
    })

    // AI 생성은 여기서 하지 않는다 (사용자 확정 사양 v2, 2026-08-09):
    // 등록은 항상 즉시 완료되고, 히어로 카드·랜딩은 고객카드의 [히어로 카드 만들기]
    // 버튼으로 저장된 사진·정보를 기반으로 생성한다.
    revalidatePath('/', 'layout')
    return { ok: true, id: ref.id }
  } catch (error) {
    console.error('[crm] createContactWithCard failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 히어로 카드 + 랜딩 자동생성 (버튼 1개 경로).
 * dataSharing 동의가 없으면 거부한다 — 동의 없는 고객 정보는 공개 영역에 절대 안 나간다.
 */
export async function generateHeroForContact(contactId: string): Promise<ActionResult> {
  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const contactRef = db.collection('contacts').doc(contactId)
    const snap = await contactRef.get()
    if (!snap.exists || snap.data()!.ownerAgentId !== uid) return { ok: false, code: 'FAILED' }

    const d = snap.data()!
    if (d.consent?.dataSharing !== true) return { ok: false, code: 'INVALID' }
    const draft = d.storeDraft as
      | {
          name: string
          tagline: string
          category: string
          address: string
          hours: { open: string; close: string }
          sns: string
          menuName: string
          menuPrice: number
          menuPhotoURL: string | null
        }
      | undefined
    if (!draft?.name || !d.photoURL) return { ok: false, code: 'INVALID' }

    // 저장된 사진을 다시 받아 AI 입력으로 쓴다
    const fetchImage = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`PHOTO_FETCH_FAILED ${res.status}`)
      return {
        data: Buffer.from(await res.arrayBuffer()),
        mime: res.headers.get('content-type') ?? 'image/jpeg',
      }
    }
    const ownerPhoto = await fetchImage(d.photoURL as string)
    const menuPhoto = draft.menuPhotoURL ? await fetchImage(draft.menuPhotoURL) : null

    const heroBuffer = await generateHeroImage({
      ownerPhoto,
      menuPhoto,
      storeName: draft.name,
      tagline: draft.tagline || d.note || '',
      category: draft.category,
    })

    const storeRef = d.storeId
      ? db.collection('stores').doc(d.storeId as string)
      : db.collection('stores').doc()
    const heroImageURL = await uploadToStorage(
      `stores/${storeRef.id}/hero-${Date.now()}.webp`,
      heroBuffer,
      'image/webp',
    )

    const now = new Date()
    await storeRef.set(
      {
        ownerAgentId: uid,
        createdByAgentId: uid,
        contactId,
        name: draft.name,
        tagline: draft.tagline,
        category: draft.category,
        address: draft.address,
        phone: (d.phone as string) ?? '',
        sns: draft.sns,
        hours: draft.hours,
        tier: (d.tier as string) ?? 'B',
        rating: 0,
        ratingCount: 0,
        reviewCount: 0,
        intro: draft.tagline,
        menus: draft.menuName
          ? [
              {
                id: 'm1',
                name: draft.menuName,
                price: draft.menuPrice,
                image: draft.menuPhotoURL ?? heroImageURL,
              },
            ]
          : [],
        heroImageURL,
        // AI 생성물 표기 의무 (docs/10 §7)
        aiGenerated: true,
        isPublic: true,
        status: 'published',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    )
    await contactRef.update({ storeId: storeRef.id, updatedAt: now })

    revalidatePath('/', 'layout')
    return { ok: true, id: storeRef.id }
  } catch (error) {
    console.error('[crm] generateHeroForContact failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 캘린더 일정 등록 (사용자 확정 사양) — 날짜를 골라 고객의 다음 연락 예정일을 잡는다.
 * 이 화면의 "일정"은 연락 예정일이다 (docs/06 §3).
 */
export async function setNextContactDate(
  contactId: string,
  dateIso: string,
): Promise<ActionResult> {
  const date = new Date(dateIso)
  if (!contactId || Number.isNaN(date.getTime())) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const ref = getAdminDb().collection('contacts').doc(contactId)
    const snap = await ref.get()
    if (!snap.exists || snap.data()!.ownerAgentId !== uid) return { ok: false, code: 'FAILED' }

    await ref.update({ nextContactDueAt: date, updatedAt: new Date() })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[crm] setNextContactDate failed:', (error as Error).message)
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

/**
 * 미디어 상담로그 (FormData) — 녹음(voice) / 사진(note+image).
 * 녹음은 **recording 동의된 고객만** 저장한다 (docs/06 §3). 서버에서 다시 확인한다.
 */
export async function addMediaInteraction(form: FormData): Promise<ActionResult> {
  const contactId = String(form.get('contactId') ?? '')
  const kind = String(form.get('kind') ?? '') as 'voice' | 'image'
  const file = form.get('file') as File | null
  const memo = String(form.get('body') ?? '').trim()
  if (!contactId || !file || file.size === 0) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const contactRef = db.collection('contacts').doc(contactId)
    const snap = await contactRef.get()
    if (!snap.exists || snap.data()!.ownerAgentId !== uid) return { ok: false, code: 'FAILED' }
    if (kind === 'voice' && snap.data()!.consent?.recording !== true) {
      return { ok: false, code: 'INVALID' }
    }

    const now = new Date()
    const ext = kind === 'voice' ? 'webm' : 'jpg'
    const url = await uploadToStorage(
      `crm/${uid}/${contactId}/log-${now.getTime()}.${ext}`,
      Buffer.from(await file.arrayBuffer()),
      file.type || (kind === 'voice' ? 'audio/webm' : 'image/jpeg'),
    )

    await contactRef.collection('interactions').add({
      type: kind === 'voice' ? 'voice' : 'note',
      body: memo,
      ...(kind === 'voice' ? { audioUrl: url, transcript: null } : { imageUrl: url }),
      createdAt: now,
    })
    const cycleDays = (snap.data()!.cycleDays as number) ?? 14
    await contactRef.update({
      nextContactDueAt: new Date(now.getTime() + cycleDays * 86_400_000),
      updatedAt: now,
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[crm] addMediaInteraction failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * 녹음 → 텍스트 정리 (사용자 확정 사양):
 * STT 후 날짜·장소·상담대상·타임스탬프별 내용·다음 액션으로 구조화해 저장한다.
 */
export async function transcribeInteraction(
  contactId: string,
  interactionId: string,
): Promise<ActionResult> {
  if (!contactId || !interactionId) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const contactRef = db.collection('contacts').doc(contactId)
    const contactSnap = await contactRef.get()
    if (!contactSnap.exists || contactSnap.data()!.ownerAgentId !== uid) {
      return { ok: false, code: 'FAILED' }
    }

    const itemRef = contactRef.collection('interactions').doc(interactionId)
    const itemSnap = await itemRef.get()
    const audioUrl = itemSnap.data()?.audioUrl as string | undefined
    if (!itemSnap.exists || !audioUrl) return { ok: false, code: 'INVALID' }

    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return { ok: false, code: 'FAILED' }
    const { transcribeAudio, chatComplete } = await import('@/lib/ai/openai')
    const raw = await transcribeAudio({
      data: Buffer.from(await audioRes.arrayBuffer()),
      mime: audioRes.headers.get('content-type') ?? 'audio/webm',
    })
    if (!raw.trim()) return { ok: false, code: 'FAILED' }

    const contact = contactSnap.data()!
    const when = (itemSnap.data()!.createdAt?.toDate?.() as Date | undefined) ?? new Date()
    const structured = await chatComplete(
      '너는 보험설계사의 상담 기록 비서다. 녹음 전사문을 아래 형식의 한국어 마크다운으로 정리한다. ' +
        '지어내지 말고 전사문에 있는 내용만 쓴다.\n' +
        '형식:\n## 상담 요약\n- 날짜: (제공값)\n- 상담 대상: (제공값)\n- 장소: 전사문에서 확인되면 기입, 아니면 "미기록"\n' +
        '\n## 타임라인\n- [주제] 내용 요약 (전사 순서대로 3~8줄)\n\n## 다음 액션\n- 해야 할 일 (없으면 "없음")',
      `날짜: ${when.toISOString().slice(0, 10)}\n상담 대상: ${contact.name} (${contact.company ?? ''})\n\n전사문:\n${raw.slice(0, 8000)}`,
    )

    await itemRef.update({ transcript: structured, transcriptRaw: raw, updatedAt: new Date() })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('[crm] transcribeInteraction failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/**
 * RAG 챗봇 (사용자 확정 사양) — 설계사가 등록한 모든 데이터(고객·상담로그)를
 * 컨텍스트로 자연어 질의응답. 데이터 규모가 작아 벡터 검색 없이 전체 주입한다.
 * 다른 설계사 데이터는 컨텍스트에 아예 들어가지 않는다 (docs/06 §10).
 */
export async function askCrmAssistant(
  question: string,
): Promise<{ ok: true; answer: string } | { ok: false; code: 'INVALID' | 'FAILED' }> {
  const q = question?.trim()
  if (!q || q.length > 500) return { ok: false, code: 'INVALID' }

  try {
    const { uid } = await requireAgent()
    const db = getAdminDb()
    const contactsSnap = await db
      .collection('contacts')
      .where('ownerAgentId', '==', uid)
      .limit(100)
      .get()

    const lines: string[] = []
    for (const doc of contactsSnap.docs) {
      const d = doc.data()
      const due = d.nextContactDueAt?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '-'
      lines.push(
        `- ${d.name} | ${d.tier}등급 | ${d.company ?? ''} ${d.position ?? ''} | ${d.phone ?? ''} | 다음연락 ${due} | 메모: ${d.note ?? ''}`,
      )
      const logs = await doc.ref
        .collection('interactions')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
      for (const log of logs.docs) {
        const l = log.data()
        const at = l.createdAt?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? ''
        const text = (l.transcript as string) || (l.body as string) || ''
        if (text) lines.push(`    · [${at}/${l.type}] ${text.slice(0, 300)}`)
      }
    }

    const { chatComplete } = await import('@/lib/ai/openai')
    const answer = await chatComplete(
      '너는 보험설계사의 CRM 비서다. 아래 고객 데이터만 근거로 한국어로 간결하게 답한다. ' +
        '데이터에 없는 내용은 "기록에 없습니다"라고 답하고 지어내지 않는다. ' +
        '고객 이름·등급·연락 예정일을 물으면 목록으로 정리해준다.',
      `[내 고객 데이터]\n${lines.join('\n').slice(0, 24000)}\n\n[질문]\n${q}`,
      900,
    )
    return { ok: true, answer }
  } catch (error) {
    console.error('[crm] askCrmAssistant failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}
