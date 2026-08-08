import { merchants, products } from './dummy-images'

/**
 * 메인(LOCAL HERO) 목데이터 — `docs/08`, `docs/assets/ref-04`.
 *
 * **여기 있는 상호·메뉴명은 콘텐츠(데이터)지 UI 텍스트가 아니다.** 그래서 messages/ 를
 * 거치지 않는다 (CLAUDE.md §3-3 은 라벨에 대한 규칙이다). 라벨은 전부 t() 로 뽑는다.
 * 실데이터가 붙는 M6 에서 이 파일은 통째로 사라진다.
 */

export type HeroCategory = 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'farm'

/** 히어로 카드 하단 칩. 라벨은 i18n, 값은 데이터. */
export type Perk =
  | { kind: 'discount'; rate: number }
  | { kind: 'signature'; value: string }
  | { kind: 'hours'; open: string; close: string }
  | { kind: 'gift'; value: string }

export type Hero = {
  id: string
  /** 사장님 이름 + 직함 */
  name: string
  tagline: string
  category: HeroCategory
  rating: number
  reviews: number
  image: string
  perks: Perk[]
}

export const HEROES: Hero[] = [
  {
    id: 'haenyeo-bapsang',
    name: '김순자 사장',
    tagline: '30년 전통 해녀밥상',
    category: 'restaurant',
    rating: 4.9,
    reviews: 128,
    image: merchants.haenyeoBapsang,
    perks: [
      { kind: 'discount', rate: 10 },
      { kind: 'signature', value: '해녀 전복뚝배기' },
      { kind: 'hours', open: '08:00', close: '20:30' },
    ],
  },
  {
    id: 'cafe-oreum',
    name: '박민수 바리스타',
    tagline: '스페셜티 핸드드립 전문',
    category: 'cafe',
    rating: 4.8,
    reviews: 96,
    image: merchants.cafeOreum,
    perks: [
      { kind: 'discount', rate: 10 },
      { kind: 'signature', value: '오름 브루' },
      { kind: 'hours', open: '09:00', close: '19:00' },
      { kind: 'gift', value: '원두증정' },
    ],
  },
  {
    id: 'morning-bakery',
    name: '이수진 사장',
    tagline: '매일 아침 굽는 건강한 빵',
    category: 'bakery',
    rating: 4.9,
    reviews: 132,
    image: merchants.morningBakery,
    perks: [
      { kind: 'discount', rate: 15 },
      { kind: 'signature', value: '버터 크루아상' },
      { kind: 'hours', open: '07:00', close: '22:00' },
    ],
  },
  {
    id: 'jeju-farmer',
    name: '김철수 농부',
    tagline: '제주 자연 재배 농산물',
    category: 'farm',
    rating: 4.9,
    reviews: 102,
    image: merchants.jejuFarmer,
    perks: [
      { kind: 'discount', rate: 10 },
      { kind: 'signature', value: '오늘 수확 감귤' },
      { kind: 'gift', value: '무료배송' },
    ],
  },
  {
    id: 'hair-studio',
    name: '이지은 디자이너',
    tagline: '헤어 스타일링 전문가',
    category: 'salon',
    rating: 4.8,
    reviews: 64,
    image: merchants.hairStudio,
    perks: [
      { kind: 'discount', rate: 10 },
      { kind: 'signature', value: '페이드컷' },
      { kind: 'hours', open: '10:00', close: '20:00' },
    ],
  },
  {
    id: 'sandeul-bbq',
    name: '강도현 사장',
    tagline: '제주 흑돼지 전문점',
    category: 'restaurant',
    rating: 4.7,
    reviews: 88,
    image: merchants.sandeulBbq,
    perks: [
      { kind: 'discount', rate: 10 },
      { kind: 'signature', value: '흑돼지 오겹살' },
      { kind: 'hours', open: '17:00', close: '23:00' },
    ],
  },
]

export type MarketItem = {
  id: string
  name: string
  sub: string
  /** 원 단위. 표시는 t('format.currency') 가 맡는다. */
  price: number
  image: string
  best?: boolean
}

export const MARKET_ITEMS: MarketItem[] = [
  {
    id: 'tangerine',
    name: '제주 감귤 5kg',
    sub: '새콤달콤 제주 감귤',
    price: 19800,
    image: products.jejuTangerine,
    best: true,
  },
  {
    id: 'carrot',
    name: '당근 2kg',
    sub: '아삭하고 신선한 당근',
    price: 12500,
    image: products.carrot,
  },
  {
    id: 'broccoli',
    name: '브로콜리 1kg',
    sub: '싱싱한 브로콜리',
    price: 8900,
    image: products.broccoli,
  },
  {
    id: 'potato',
    name: '감자 3kg',
    sub: '포슬포슬 제주 감자',
    price: 9900,
    image: products.potato,
  },
  {
    id: 'coffee',
    name: '콜롬비아 원두 200g',
    sub: '갓 볶은 스페셜티',
    price: 13800,
    image: products.coffeeBeans,
  },
  {
    id: 'cookie',
    name: '수제 쿠키 세트',
    sub: '매일 굽는 수제 쿠키',
    price: 9900,
    image: products.cookieSet,
  },
]
