import 'server-only'

import { randomUUID } from 'node:crypto'
import { getAdminDb } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'
import { HEROES, type Hero, type HeroCategory } from '@/lib/mock/home'
import { findStore, STORES, type Store } from '@/lib/mock/store'

/**
 * 히어로 카드·랜딩의 데이터 소스.
 * 설계사가 생성한 실매장(Firestore stores)이 먼저 오고, 화면이 비지 않도록
 * 목데이터가 뒤를 채운다. 실매장이 쌓이면 목데이터는 자연히 밀려난다.
 */

export type StoreDoc = Store & {
  ownerAgentId: string
  contactId: string | null
  phone: string
  sns: string
  aiGenerated: boolean
}

function toStore(id: string, d: FirebaseFirestore.DocumentData): StoreDoc {
  return {
    id,
    name: (d.name as string) ?? '',
    tagline: (d.tagline as string) ?? '',
    tier: (d.tier as Store['tier']) ?? 'B',
    category: (d.category as Store['category']) ?? 'etc',
    rating: (d.rating as number) ?? 0,
    ratingCount: (d.ratingCount as number) ?? 0,
    reviewCount: (d.reviewCount as number) ?? 0,
    hours: (d.hours as Store['hours']) ?? { open: '09:00', close: '18:00' },
    address: (d.address as string) ?? '',
    phone: (d.phone as string) ?? '',
    sns: (d.sns as string) ?? '',
    heroImage: (d.heroImageURL as string) ?? '',
    intro: (d.intro as string) ?? '',
    menus: (d.menus as Store['menus']) ?? [],
    ownerAgentId: (d.ownerAgentId as string) ?? '',
    contactId: (d.contactId as string | null) ?? null,
    aiGenerated: d.aiGenerated === true,
  }
}

/** 공개된 실매장 목록 (메인 캐러셀·히어로 목록용). */
export async function listPublishedStores(limit = 12): Promise<StoreDoc[]> {
  const snap = await getAdminDb()
    .collection('stores')
    .where('isPublic', '==', true)
    .where('status', '==', 'published')
    .limit(limit)
    .get()
  return snap.docs.map((doc) => toStore(doc.id, doc.data()))
}

/** 실매장 + 목데이터 폴백으로 히어로 목록을 만든다. */
export async function listHeroes(): Promise<Hero[]> {
  const real = await listPublishedStores()
  const realHeroes: Hero[] = real
    .filter((s) => s.heroImage)
    .map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      category: (['restaurant', 'cafe', 'bakery', 'salon', 'farm'].includes(s.category)
        ? s.category
        : 'restaurant') as HeroCategory,
      rating: s.rating || 5.0,
      reviews: s.ratingCount,
      image: s.heroImage,
      perks: [
        { kind: 'signature', value: s.menus[0]?.name ?? s.tagline },
        { kind: 'hours', open: s.hours.open, close: s.hours.close },
      ],
    }))
  return [...realHeroes, ...HEROES].slice(0, 12)
}

/** 랜딩 페이지용 단건 조회 — 실매장 우선, 목데이터 폴백. */
export async function getStoreForLanding(storeId: string): Promise<Store | null> {
  const doc = await getAdminDb().collection('stores').doc(storeId).get()
  if (doc.exists) {
    const d = doc.data()!
    if (d.isPublic === true && d.status === 'published') return toStore(doc.id, d)
    return null
  }
  return findStore(storeId) ?? null
}

/** 내 매장 화면용 — 설계사/업주가 만든 매장 + 목데이터 폴백. */
export async function listStoresForOwner(uid: string): Promise<Store[]> {
  const snap = await getAdminDb()
    .collection('stores')
    .where('ownerAgentId', '==', uid)
    .limit(12)
    .get()
  const own = snap.docs.map((doc) => toStore(doc.id, doc.data()))
  return own.length ? own : STORES
}

/** Storage 업로드 → 다운로드 토큰 URL. 더미 이미지와 같은 패턴이라 규칙 변경이 없다. */
export async function uploadToStorage(
  path: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  getAdminDb() // Admin 앱 초기화 보장 — getStorage() 는 기본 앱을 쓴다
  const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  const token = randomUUID()
  await bucket.file(path).save(data, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  })
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}
