import { products, realty } from './dummy-images'

/**
 * 소상공인 커뮤니티 홈 목데이터 — `docs/07` A, `docs/assets/ref-02`.
 * 글 제목·매물명은 콘텐츠(데이터)라 messages/ 를 거치지 않는다. 라벨은 전부 t() 로.
 * 실데이터가 붙는 M5 후반에서 이 파일은 사라진다.
 */

export type AnonymousPost = {
  id: string
  title: string
  /** 분 단위 경과 시간. 표시는 포매터가 맡는다. */
  minutesAgo: number
  comments: number
}

/** 익명방 미리보기 (ref-02). liveCount 는 최근 24시간 작성자 수 (docs/07 A-4). */
export const ANONYMOUS_ROOM = {
  liveCount: 342,
  posts: [
    { id: 'a1', title: '요즘 매출이 너무 안 나와서 힘드네요…', minutesAgo: 10, comments: 23 },
    { id: 'a2', title: '직원 구하기가 왜 이렇게 어려울까요?', minutesAgo: 25, comments: 17 },
    { id: 'a3', title: '배달 수수료 너무 비싸요 ㅠㅠ', minutesAgo: 60, comments: 31 },
  ] satisfies AnonymousPost[],
}

export type RealtyListing = {
  id: string
  kind: 'rent' | 'sale'
  title: string
  /** 만원 단위 보증금 또는 매매가 표기 문자열 — 목업이라 표기 그대로 둔다 */
  priceMain: string
  priceSub: string
  image: string
}

export const REALTY_LISTINGS: RealtyListing[] = [
  {
    id: 'r1',
    kind: 'rent',
    title: '제주시 연동 상가',
    priceMain: '보증금 3,000',
    priceSub: '월 150 · 25평 · 1층',
    image: realty.storefront1,
  },
  {
    id: 'r2',
    kind: 'sale',
    title: '서귀포 중문 상가',
    priceMain: '매매가 2.8억',
    priceSub: '45평 · 1층',
    image: realty.storefront2,
  },
  {
    id: 'r3',
    kind: 'rent',
    title: '애월 카페 자리',
    priceMain: '보증금 1,000',
    priceSub: '월 80 · 15평',
    image: realty.storefront3,
  },
]

export type SupportProgram = {
  id: string
  kind: 'grant' | 'loan'
  title: string
  summary: string
  /** docs/02 §7 — sourceUrl 없는 레코드는 렌더하지 않는다 */
  sourceUrl: string
}

export const SUPPORT_PROGRAMS: SupportProgram[] = [
  {
    id: 's1',
    kind: 'grant',
    title: '소상공인 경영안정자금',
    summary: '최대 7천만원 · 연 2.0%',
    sourceUrl: 'https://www.semas.or.kr',
  },
  {
    id: 's2',
    kind: 'loan',
    title: '소상공인 특별 대출 (저금리 전환)',
    summary: '최대 1억원 · 연 1.5%',
    sourceUrl: 'https://www.kosmes.or.kr',
  },
  {
    id: 's3',
    kind: 'grant',
    title: '청년 소상공인 창업 지원',
    summary: '최대 5천만원 · 창업자금 지원',
    sourceUrl: 'https://www.jeju.go.kr',
  },
]

export type GroupBuy = {
  id: string
  title: string
  discountRate: number
  daysLeft: number
  participants: number
  image: string
}

export const GROUP_BUYS: GroupBuy[] = [
  {
    id: 'g1',
    title: '식자재 공동구매 (6월 2차)',
    discountRate: 28,
    daysLeft: 2,
    participants: 128,
    image: products.blackPork,
  },
]
