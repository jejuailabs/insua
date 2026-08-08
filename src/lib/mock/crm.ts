import { avatars } from './dummy-images'

/**
 * CRM 목데이터 — `docs/06`, `docs/assets/ref-03`.
 * 상호·인명은 콘텐츠(데이터)라 messages/ 를 거치지 않는다. 라벨은 전부 t() 로.
 * 실데이터가 붙는 M4 후반에서 이 파일은 사라진다.
 */

export type Tier = 'S' | 'A' | 'B' | 'C'

export type Contact = {
  id: string
  name: string
  company: string
  position: string
  phone: string
  tier: Tier
  note: string
  photo: string
  website?: string
  socials?: Array<'instagram' | 'kakao'>
  /** 연락 예정일이 며칠 지났는지. 0 이하면 아직 여유 있음 (docs/06 §5). */
  overdueDays?: number
}

export const CONTACTS: Contact[] = [
  {
    id: 'kim-minsu',
    name: '김민수',
    company: '제주중앙자동차',
    position: '대표',
    phone: '010-1234-5678',
    tier: 'A',
    note: '신차 출시 관심 높음',
    photo: avatars.kimMinsu,
    socials: ['instagram'],
    overdueDays: 2,
  },
  {
    id: 'lee-jeongeun',
    name: '이정은',
    company: '카페 오션뷰',
    position: '사장',
    phone: '010-2345-6789',
    tier: 'B',
    note: '여름 시즌 프로모션 관심 있음',
    photo: avatars.leeJeongeun,
    socials: ['instagram'],
  },
  {
    id: 'park-cheolsu',
    name: '박철수',
    company: '한라건설',
    position: '이사',
    phone: '010-3456-7890',
    tier: 'C',
    note: '연말 예산 편성 중',
    photo: avatars.parkCheolsu,
    website: 'www.hallaconst.co.kr',
  },
  {
    id: 'choi-yujin',
    name: '최유진',
    company: '뷰티살롱 유진',
    position: '원장',
    phone: '010-4567-8901',
    tier: 'A',
    note: '신규 지점 오픈 준비',
    photo: avatars.choiYujin,
    socials: ['instagram', 'kakao'],
  },
  {
    id: 'jung-haeun',
    name: '정하은',
    company: '올레길 게스트하우스',
    position: '대표',
    phone: '010-5678-9012',
    tier: 'B',
    note: '성수기 대비 보험 재검토 요청',
    photo: avatars.jungHaeun,
    overdueDays: 5,
  },
  {
    id: 'kang-donghyun',
    name: '강동현',
    company: '동문시장 수산',
    position: '실장',
    phone: '010-6789-0123',
    tier: 'B',
    note: '자녀 학자금 상품 문의',
    photo: avatars.kangDonghyun,
    socials: ['kakao'],
  },
  {
    id: 'song-mira',
    name: '송미라',
    company: '미라꽃집',
    position: '사장',
    phone: '010-7890-1234',
    tier: 'C',
    note: '배송 차량 보험 갱신 예정',
    photo: avatars.songMira,
  },
  {
    id: 'yoon-taeho',
    name: '윤태호',
    company: '스카이드론 촬영',
    position: '대표',
    phone: '010-8901-2345',
    tier: 'S',
    note: '장비 보험 신규 가입 검토',
    photo: avatars.yoonTaeho,
    socials: ['instagram'],
  },
]

/** 필터칩 카운트 — 실데이터에서 센다 (docs/06 §4). */
export function tierCounts(contacts: Contact[]): Record<Tier, number> {
  const counts: Record<Tier, number> = { S: 0, A: 0, B: 0, C: 0 }
  for (const c of contacts) counts[c.tier]++
  return counts
}
