import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import type { Contact, ContactConsent, Interaction, InteractionType, Tier } from './types'

/** Admin SDK 조회 — ownerAgentId 로만 거른다 (docs/06 §10). 직렬화해서 내려준다. */

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

function toContact(id: string, d: FirebaseFirestore.DocumentData): Contact {
  const consent = (d.consent ?? {}) as Partial<ContactConsent>
  return {
    id,
    name: (d.name as string) ?? '',
    company: (d.company as string) ?? '',
    position: (d.position as string) ?? '',
    phone: (d.phone as string) ?? '',
    tier: (d.tier as Tier) ?? 'B',
    note: (d.note as string) ?? '',
    photoURL: (d.photoURL as string | null) ?? null,
    website: (d.website as string) ?? '',
    cycleDays: (d.cycleDays as number) ?? 14,
    nextContactDueAt: toIso(d.nextContactDueAt),
    consent: {
      dataSharing: consent.dataSharing === true,
      portrait: consent.portrait === true,
      recording: consent.recording === true,
    },
    createdAt: toIso(d.createdAt) ?? new Date(0).toISOString(),
    storeId: (d.storeId as string | null) ?? null,
    hasStoreDraft: Boolean((d.storeDraft as { name?: string } | undefined)?.name),
  }
}

export async function listContacts(agentUid: string): Promise<Contact[]> {
  const snap = await getAdminDb().collection('contacts').where('ownerAgentId', '==', agentUid).get()
  return snap.docs.map((doc) => toContact(doc.id, doc.data()))
}

export async function getContact(agentUid: string, contactId: string): Promise<Contact | null> {
  const doc = await getAdminDb().collection('contacts').doc(contactId).get()
  if (!doc.exists || doc.data()!.ownerAgentId !== agentUid) return null
  return toContact(doc.id, doc.data()!)
}

export async function listInteractions(
  agentUid: string,
  contactId: string,
): Promise<Interaction[]> {
  // 소유권 확인이 먼저다 — 남의 고객 타임라인은 존재조차 안 보인다.
  const owner = await getContact(agentUid, contactId)
  if (!owner) return []

  const snap = await getAdminDb()
    .collection('contacts')
    .doc(contactId)
    .collection('interactions')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return snap.docs.map((doc) => {
    const d = doc.data()
    return {
      id: doc.id,
      type: (d.type as InteractionType) ?? 'note',
      body: (d.body as string) ?? '',
      createdAt: toIso(d.createdAt) ?? new Date(0).toISOString(),
      audioUrl: (d.audioUrl as string | null) ?? null,
      imageUrl: (d.imageUrl as string | null) ?? null,
      transcript: (d.transcript as string | null) ?? null,
    }
  })
}

/** 이번 달 접촉 횟수 (타입별) — 통계 화면용. */
export async function countMonthlyInteractions(
  agentUid: string,
  contacts: Contact[],
): Promise<Record<InteractionType, number>> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const counts: Record<InteractionType, number> = { note: 0, call: 0, visit: 0, voice: 0 }
  // 고객 수가 목업 규모라 순차 조회로 충분하다. 실데이터 규모가 되면 collectionGroup 으로 바꾼다.
  await Promise.all(
    contacts.map(async (contact) => {
      const snap = await getAdminDb()
        .collection('contacts')
        .doc(contact.id)
        .collection('interactions')
        .where('createdAt', '>=', Timestamp.fromDate(monthStart))
        .get()
      for (const doc of snap.docs) {
        const type = (doc.data().type as InteractionType) ?? 'note'
        counts[type] = (counts[type] ?? 0) + 1
      }
    }),
  )
  return counts
}
