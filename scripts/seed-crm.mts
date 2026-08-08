/**
 * 개발용 CRM 시드 (개발 도구 — 앱 런타임 아님)
 *
 *   node scripts/seed-crm.mts          # dev-agent 계정에 목업 고객 8명 + 상담로그
 *
 * 프로덕션 사용자 데이터는 건드리지 않는다. dev-agent@test.local 소유 문서만 만든다.
 * 이미 있으면 건너뛴다(멱등).
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function env(): Record<string, string> {
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) throw new Error('.env.local 이 없다.')
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m) out[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const CONTACTS = [
  {
    name: '김민수',
    company: '제주중앙자동차',
    position: '대표',
    phone: '010-1234-5678',
    tier: 'A',
    note: '신차 출시 관심 높음',
    img: 'kim-minsu',
    overdue: 2,
  },
  {
    name: '이정은',
    company: '카페 오션뷰',
    position: '사장',
    phone: '010-2345-6789',
    tier: 'B',
    note: '여름 시즌 프로모션 관심 있음',
    img: 'lee-jeongeun',
    overdue: -3,
  },
  {
    name: '박철수',
    company: '한라건설',
    position: '이사',
    phone: '010-3456-7890',
    tier: 'C',
    note: '연말 예산 편성 중',
    img: 'park-cheolsu',
    overdue: -10,
    website: 'www.hallaconst.co.kr',
  },
  {
    name: '최유진',
    company: '뷰티살롱 유진',
    position: '원장',
    phone: '010-4567-8901',
    tier: 'A',
    note: '신규 지점 오픈 준비',
    img: 'choi-yujin',
    overdue: -1,
  },
  {
    name: '정하은',
    company: '올레길 게스트하우스',
    position: '대표',
    phone: '010-5678-9012',
    tier: 'B',
    note: '성수기 대비 보험 재검토 요청',
    img: 'jung-haeun',
    overdue: 5,
  },
  {
    name: '강동현',
    company: '동문시장 수산',
    position: '실장',
    phone: '010-6789-0123',
    tier: 'B',
    note: '자녀 학자금 상품 문의',
    img: 'kang-donghyun',
    overdue: -6,
  },
  {
    name: '송미라',
    company: '미라꽃집',
    position: '사장',
    phone: '010-7890-1234',
    tier: 'C',
    note: '배송 차량 보험 갱신 예정',
    img: 'song-mira',
    overdue: -20,
  },
  {
    name: '윤태호',
    company: '스카이드론 촬영',
    position: '대표',
    phone: '010-8901-2345',
    tier: 'S',
    note: '장비 보험 신규 가입 검토',
    img: 'yoon-taeho',
    overdue: -2,
    recording: true,
  },
] as const

const CYCLE = { S: 3, A: 7, B: 14, C: 30 } as const

async function main() {
  const e = env()
  const app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        credential: cert({
          projectId: e.FIREBASE_PROJECT_ID!,
          clientEmail: e.FIREBASE_CLIENT_EMAIL!,
          privateKey: e.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      })
  const uid = (await getAuth(app).getUserByEmail('dev-agent@test.local')).uid
  const db = getFirestore(app)

  const existing = await db.collection('contacts').where('ownerAgentId', '==', uid).limit(1).get()
  if (!existing.empty) {
    console.log('이미 시드돼 있다. 건너뛴다.')
    return
  }

  // 아바타 URL 은 업로드 매니페스트에서 읽는다.
  const manifest = readFileSync(join(ROOT, 'src/lib/mock/dummy-images.ts'), 'utf8')
  const urlOf = (slug: string) => {
    const m = new RegExp(`'(https://[^']*${slug}[^']*)'`).exec(manifest)
    return m?.[1] ?? null
  }

  const now = Date.now()
  for (const c of CONTACTS) {
    const ref = await db.collection('contacts').add({
      ownerAgentId: uid,
      name: c.name,
      company: c.company,
      position: c.position,
      phone: c.phone,
      tier: c.tier,
      cycleDays: CYCLE[c.tier],
      note: c.note,
      photoURL: urlOf(c.img),
      website: 'website' in c ? c.website : '',
      consent: { dataSharing: true, portrait: true, recording: 'recording' in c },
      nextContactDueAt: new Date(now - c.overdue * 86_400_000),
      createdAt: new Date(now - 30 * 86_400_000),
      updatedAt: new Date(),
    })
    await ref.collection('interactions').add({
      type: 'call',
      body: `${c.name}님과 통화 — ${c.note}`,
      createdAt: new Date(now - 3 * 86_400_000),
    })
    console.log(`  + ${c.name} (${c.tier})`)
  }
  console.log('시드 완료')
}

main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`)
  process.exitCode = 1
})
