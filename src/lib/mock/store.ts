import { merchants, products } from './dummy-images'
import type { HeroCategory } from './home'

/**
 * 내 매장 목데이터 — `docs/07` B, `docs/assets/ref-01`.
 * 상호·메뉴명·소개문은 콘텐츠(데이터)라 messages/ 를 거치지 않는다. 라벨은 전부 t() 로.
 * 실데이터(Firestore stores)가 붙는 M5 후반에서 이 파일은 사라진다.
 */

export type StoreCategory = HeroCategory | 'retail' | 'etc'

export type MenuItem = { id: string; name: string; price: number; image: string }

export type ModuleId = 'menu' | 'about' | 'news'

export type Store = {
  id: string
  name: string
  tagline: string
  /** 설계사가 매긴 고객 등급. CRM 전용 — 공개·업주 화면으로는 내려보내지 않는다. */
  tier?: 'S' | 'A' | 'B' | 'C'
  category: StoreCategory
  rating: number
  ratingCount: number
  reviewCount: number
  hours: { open: string; close: string }
  address: string
  phone: string
  heroImage: string
  intro: string
  menus: MenuItem[]
}

/** 업종별 메뉴 섹션 제목 (docs/07 B-2). 하나로 통일하지 말 것 — 의도된 차이다. */
export const MENU_SECTION_KEY: Record<StoreCategory, string> = {
  restaurant: 'merchant.representativeMenu',
  cafe: 'merchant.signatureMenu',
  bakery: 'merchant.popularMenu',
  salon: 'merchant.signatureService',
  farm: 'merchant.mainProduce',
  retail: 'merchant.popularItems',
  etc: 'merchant.representativeMenu',
}

export const STORES: Store[] = [
  {
    id: 'haenyeo-bapsang',
    name: '제주 해녀밥상',
    tagline: '30년 전통 해산물 전문',
    tier: 'A',
    category: 'restaurant',
    rating: 4.9,
    ratingCount: 128,
    reviewCount: 256,
    hours: { open: '08:00', close: '20:30' },
    address: '제주시 서귀포시',
    phone: '064-712-3456',
    heroImage: merchants.haenyeoBapsang,
    intro: '바다의 신선함을 그대로 담았습니다.\n30년간 해녀의 손맛으로 정성껏 차립니다.',
    menus: [
      { id: 'm1', name: '해녀 전복뚝배기', price: 18000, image: products.abaloneStew },
      { id: 'm2', name: '몸국', price: 12000, image: products.momguk },
      { id: 'm3', name: '성게 미역국', price: 16000, image: products.seaweedSoup },
    ],
  },
  {
    id: 'cafe-oreum',
    name: '카페 오름',
    tagline: '스페셜티 핸드드립 전문',
    tier: 'S',
    category: 'cafe',
    rating: 4.8,
    ratingCount: 96,
    reviewCount: 184,
    hours: { open: '08:00', close: '21:00' },
    address: '제주시 연동 123',
    phone: '064-723-4567',
    heroImage: merchants.cafeOreum,
    intro: '좋은 원두와 정성으로\n매일 최고의 한 잔을 만듭니다.',
    menus: [
      { id: 'm1', name: '오늘 라떼', price: 6000, image: products.latte },
      { id: 'm2', name: '오름 브루', price: 6500, image: products.oreumBrew },
      { id: 'm3', name: '바닐라 빈 라떼', price: 6500, image: products.vanillaLatte },
    ],
  },
  {
    id: 'morning-bakery',
    name: '모닝베이커리',
    tagline: '매일 아침 굽는 건강한 빵',
    tier: 'A',
    category: 'bakery',
    rating: 4.9,
    ratingCount: 132,
    reviewCount: 210,
    hours: { open: '07:00', close: '22:00' },
    address: '제주시 연동 234-1',
    phone: '064-734-5678',
    heroImage: merchants.morningBakery,
    intro: '좋은 재료로 매일 아침 정성껏 구워냅니다.\n따뜻한 빵과 함께 행복한 하루 되세요!',
    menus: [
      { id: 'm1', name: '버터 크루아상', price: 3800, image: products.croissant },
      { id: 'm2', name: '단팥빵', price: 2500, image: products.sweetBread },
      { id: 'm3', name: '소금빵', price: 2800, image: products.saltBread },
    ],
  },
  {
    id: 'sandeul-bbq',
    name: '산들숯불구이',
    tagline: '제주 흑돼지 전문점',
    tier: 'B',
    category: 'restaurant',
    rating: 4.7,
    ratingCount: 88,
    reviewCount: 156,
    hours: { open: '17:00', close: '23:00' },
    address: '제주시 이도이동 45',
    phone: '064-745-6789',
    heroImage: merchants.sandeulBbq,
    intro: '참숯에 구워 더욱 맛있는 제주 흑돼지!\n신선한 고기와 정성으로 모시겠습니다.',
    menus: [
      { id: 'm1', name: '흑돼지 오겹살', price: 18000, image: products.blackPork },
      { id: 'm2', name: '목살', price: 18000, image: products.porkNeck },
      { id: 'm3', name: '된장찌개', price: 5000, image: products.doenjangStew },
    ],
  },
]

export function findStore(id: string): Store | undefined {
  return STORES.find((s) => s.id === id)
}
