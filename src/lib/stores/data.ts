import 'server-only'

import { randomUUID } from 'node:crypto'
import { getAdminDb } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'
import { HEROES, type Hero, type HeroCategory, type RestaurantSub } from '@/lib/mock/home'
import { findStore, STORES, type Store } from '@/lib/mock/store'

/**
 * 히어로 카드·랜딩의 데이터 소스.
 * 설계사가 생성한 실매장(Firestore stores)이 먼저 오고, 화면이 비지 않도록
 * 목데이터가 뒤를 채운다. 실매장이 쌓이면 목데이터는 자연히 밀려난다.
 */

/** AI가 발행한 랜딩 카피 (사용자 확정 사양) — SEO/AEO/GEO 용. */
export type StoreSeo = {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  longTailKeywords: string[]
  headline: string
  subheadline: string
  sections: Array<{ heading: string; body: string }>
  faq: Array<{ q: string; a: string }>
  highlights: string[]
}

export type StoreDoc = Store & {
  ownerAgentId: string
  contactId: string | null
  phone: string
  sns: string
  aiGenerated: boolean
  subCategory?: string
  createdAtMs: number
  lat?: number
  lng?: number
  seo?: StoreSeo
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
    subCategory: (d.subCategory as string) || undefined,
    createdAtMs: d.createdAt?.toMillis?.() ?? 0,
    lat: typeof d.lat === 'number' ? d.lat : undefined,
    lng: typeof d.lng === 'number' ? d.lng : undefined,
    seo: (d.seo as StoreSeo) ?? undefined,
  }
}

/**
 * 좌표 없는 실매장을 지오코딩해 문서에 캐시한다 (Nominatim 1건/요청 — 정책 준수).
 * 실패해도 조용히 넘어간다 — 좌표는 거리순·지도 보기의 부가 정보다.
 */
async function backfillCoords(stores: StoreDoc[]): Promise<void> {
  const target = stores.find((s) => s.address && s.lat === undefined)
  if (!target) return
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(target.address)}`,
      { headers: { 'User-Agent': 'local-os/0.1 (insua.vercel.app)' } },
    )
    const rows = (await res.json()) as Array<{ lat: string; lon: string }>
    const hit = rows[0]
    if (!hit) return
    target.lat = Number(hit.lat)
    target.lng = Number(hit.lon)
    await getAdminDb()
      .collection('stores')
      .doc(target.id)
      .set({ lat: target.lat, lng: target.lng }, { merge: true })
  } catch {
    // 지오코딩 실패는 치명적이지 않다
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

function storeToHero(s: StoreDoc): Hero {
  return {
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    category: (['restaurant', 'cafe', 'bakery', 'salon', 'farm'].includes(s.category)
      ? s.category
      : 'restaurant') as HeroCategory,
    rating: s.rating || 5.0,
    reviews: s.ratingCount,
    subCategory: (s as StoreDoc & { subCategory?: RestaurantSub }).subCategory,
    image: s.heroImage,
    perks: [
      { kind: 'signature', value: s.menus[0]?.name ?? s.tagline },
      { kind: 'hours', open: s.hours.open, close: s.hours.close },
    ],
    lat: s.lat,
    lng: s.lng,
  }
}

/** 실매장 + 목데이터 폴백으로 히어로 목록을 만든다. 메인 20장, 히어로 허브 최대 50장. */
export async function listHeroes(limit = 12): Promise<Hero[]> {
  const real = (await listPublishedStores(60)).filter((s) => s.heroImage)
  await backfillCoords(real)
  const realHeroes = real.map(storeToHero)
  // 노출 순서 (사용자 확정 사양): 위치기반 정렬은 클라이언트(거리순 토글)가 맡고,
  // 서버 기본 순서는 신규(5일 이내) 실매장 최신순 → 나머지 요청마다 랜덤 셔플.
  const FIVE_DAYS = 5 * 86_400_000
  const now = Date.now()
  const withMeta = realHeroes.map((hero, i) => ({ hero, createdAtMs: real[i]?.createdAtMs ?? 0 }))
  const fresh = withMeta
    .filter((x) => now - x.createdAtMs <= FIVE_DAYS)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map((x) => x.hero)
  const rest = [
    ...withMeta.filter((x) => now - x.createdAtMs > FIVE_DAYS).map((x) => x.hero),
    ...HEROES,
  ]
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i]!, rest[j]!] = [rest[j]!, rest[i]!]
  }
  return [...fresh, ...rest].slice(0, limit)
}

/** 찜한가게 목록용 — 저장된 id 로 실매장·목데이터를 함께 찾는다. */
export async function listHeroesByIds(ids: string[]): Promise<Hero[]> {
  if (!ids.length) return []
  const db = getAdminDb()
  const out: Hero[] = []
  for (const id of ids.slice(0, 30)) {
    const mock = HEROES.find((h) => h.id === id)
    if (mock) {
      out.push(mock)
      continue
    }
    const doc = await db.collection('stores').doc(id).get()
    if (doc.exists && doc.data()!.status === 'published') {
      const store = toStore(doc.id, doc.data()!)
      if (store.heroImage) out.push(storeToHero(store))
    }
  }
  return out
}

/** 랜딩 페이지용 단건 조회 — 실매장 우선, 목데이터 폴백. */
export async function getStoreForLanding(storeId: string): Promise<
  | (Store & {
      seo?: StoreSeo
      sns?: string
      lat?: number
      lng?: number
      aiGenerated?: boolean
    })
  | null
> {
  const doc = await getAdminDb().collection('stores').doc(storeId).get()
  if (doc.exists) {
    const d = doc.data()!
    if (d.isPublic === true && d.status === 'published') return toStore(doc.id, d)
    return null
  }
  return findStore(storeId) ?? null
}

/** sitemap 용 — 공개된 실매장의 id·수정시각만. */
export async function listPublishedStoreIds(): Promise<Array<{ id: string; updatedAt: Date }>> {
  const snap = await getAdminDb()
    .collection('stores')
    .where('isPublic', '==', true)
    .where('status', '==', 'published')
    .limit(500)
    .get()
  return snap.docs.map((doc) => ({
    id: doc.id,
    updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
  }))
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
