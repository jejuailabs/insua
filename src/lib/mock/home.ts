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

export type RestaurantSub =
  'meat' | 'seafood' | 'korean' | 'chinese' | 'japanese' | 'western' | 'snack' | 'chicken'

export type Hero = {
  id: string
  /** 사장님 이름 + 직함 */
  name: string
  tagline: string
  category: HeroCategory
  /** 식당 세부 업종 (사용자 확정 사양) — 카테고리 필터 2단계 */
  subCategory?: RestaurantSub
  rating: number
  reviews: number
  image: string
  perks: Perk[]
  /** 거리순 정렬·지도 보기용 좌표 (WGS84). 실매장은 주소 지오코딩으로 채운다. */
  lat?: number
  lng?: number
}

export const HEROES: Hero[] = [
  {
    id: 'haenyeo-bapsang',
    lat: 33.5567,
    lng: 126.7959,
    name: '김순자 사장',
    tagline: '30년 전통 해녀밥상',
    category: 'restaurant',
    subCategory: 'seafood',
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
    lat: 33.4996,
    lng: 126.5312,
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
    lat: 33.489,
    lng: 126.4983,
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
    lat: 33.4629,
    lng: 126.3312,
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
    lat: 33.4874,
    lng: 126.4863,
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
    lat: 33.2541,
    lng: 126.5601,
    name: '강도현 사장',
    tagline: '제주 흑돼지 전문점',
    category: 'restaurant',
    subCategory: 'meat',
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
  /** 배달 가능 유무 (사용자 확정 사양) — 카드에 칩으로 한눈에 보인다. */
  deliveryAvailable?: boolean
  deliveryFee?: number
}

const tangerine: MarketItem = {
  id: 'tangerine',
  name: '제주 감귤 5kg',
  sub: '새콤달콤 제주 감귤',
  price: 19800,
  image: products.jejuTangerine,
  best: true,
}
const carrot: MarketItem = {
  id: 'carrot',
  name: '당근 2kg',
  sub: '아삭하고 신선한 당근',
  price: 12500,
  image: products.carrot,
}

/**
 * 활성 히어로의 업종에 따라 하단 상품 섹션이 통째로 바뀐다 (ref-04, docs/08 §6).
 * 섹션 제목은 `consumer.productSection.{category}` 키가 맡는다.
 */
export const CATEGORY_PRODUCTS: Record<HeroCategory, MarketItem[]> = {
  restaurant: [
    tangerine,
    carrot,
    {
      id: 'broccoli',
      name: '브로콜리 1kg',
      sub: '싱싱한 브로콜리',
      price: 8900,
      image: products.broccoli,
    },
  ],
  cafe: [
    {
      id: 'colombia',
      name: '콜롬비아 원두 200g',
      sub: '갓 볶은 스페셜티',
      price: 13800,
      image: products.coffeeBeans,
    },
    {
      id: 'ethiopia',
      name: '에티오피아 원두 200g',
      sub: '산미 좋은 싱글오리진',
      price: 14800,
      image: products.ethiopiaBeans,
    },
    {
      id: 'cookie',
      name: '수제 쿠키 세트',
      sub: '매일 굽는 수제 쿠키',
      price: 9900,
      image: products.cookieSet,
    },
  ],
  bakery: [
    {
      id: 'croissant',
      name: '버터 크루아상',
      sub: '겹겹이 바삭한 버터 풍미',
      price: 3800,
      image: products.croissant,
    },
    {
      id: 'sweet-bread',
      name: '단팥빵',
      sub: '직접 쑨 팥소 가득',
      price: 2500,
      image: products.sweetBread,
    },
    {
      id: 'salt-bread',
      name: '소금빵',
      sub: '고소한 버터와 소금',
      price: 2800,
      image: products.saltBread,
    },
  ],
  salon: [
    {
      id: 'shampoo',
      name: '두피 샴푸 500ml',
      sub: '순한 두피 케어',
      price: 22000,
      image: products.shampoo,
    },
    {
      id: 'hair-oil',
      name: '헤어 에센스 오일',
      sub: '윤기 나는 머릿결',
      price: 18000,
      image: products.hairOil,
    },
    {
      id: 'treatment',
      name: '헤어 트리트먼트',
      sub: '손상모 집중 케어',
      price: 16000,
      image: products.hairTreatment,
    },
  ],
  farm: [
    tangerine,
    carrot,
    {
      id: 'potato',
      name: '감자 3kg',
      sub: '포슬포슬 제주 감자',
      price: 9900,
      image: products.potato,
    },
  ],
}

/** 기본(공개 랜딩) 상품 목록 — 첫 히어로 업종 기준. */
export const MARKET_ITEMS: MarketItem[] = CATEGORY_PRODUCTS.restaurant
