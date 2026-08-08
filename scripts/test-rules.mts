/**
 * Security Rules 테스트 (docs/12 §9-1).
 *
 * "남의 데이터가 안 보인다" 를 말이 아니라 실제로 검증한다.
 * 에뮬레이터가 떠 있어야 한다:
 *
 *   pnpm emu          # 다른 터미널에서
 *   pnpm test:rules
 */
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const PROJECT_ID = 'local-os-rules-test'

let passed = 0
let failed = 0

async function check(name: string, run: () => Promise<unknown>) {
  try {
    await run()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`      ${(error as Error).message.split('\n')[0]}`)
  }
}

const env: RulesTestEnvironment = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
})

// 인증 컨텍스트. 두 번째 인자가 커스텀 클레임이 된다.
const agentA = env.authenticatedContext('agentA', { role: 'agent' }).firestore()
const agentB = env.authenticatedContext('agentB', { role: 'agent' }).firestore()
const merchant = env.authenticatedContext('merchant1', { role: 'merchant' }).firestore()
const admin = env.authenticatedContext('admin1', { role: 'agent', admin: true }).firestore()
const anon = env.unauthenticatedContext().firestore()

// 규칙을 우회해 시드 데이터를 심는다.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'users/agentA'), { uid: 'agentA', role: 'agent', isAdmin: false })
  await setDoc(doc(db, 'contacts/c1'), { ownerAgentId: 'agentA', name: '김민수' })
  await setDoc(doc(db, 'contacts/c1/interactions/i1'), { contactId: 'c1', body: '상담 메모' })
  await setDoc(doc(db, 'anonymousPosts/p1'), { authorUid: 'merchant1', body: '고민' })
  await setDoc(doc(db, 'auditLogs/a1'), { actorUid: 'admin1', action: 'post.hide' })
  await setDoc(doc(db, 'stores/public1'), { isPublic: true, status: 'published', ownerUid: 'm1' })
  await setDoc(doc(db, 'stores/draft1'), { isPublic: false, status: 'draft', ownerUid: 'm1' })
})

console.log('\ncontacts — 데이터 소유권 경계 (docs/06 §10)')
await check('소유 설계사는 자기 고객을 읽는다', () =>
  assertSucceeds(getDoc(doc(agentA, 'contacts/c1'))),
)
await check('다른 설계사는 남의 고객을 읽지 못한다', () =>
  assertFails(getDoc(doc(agentB, 'contacts/c1'))),
)
await check('다른 설계사는 남의 고객을 수정하지 못한다', () =>
  assertFails(updateDoc(doc(agentB, 'contacts/c1'), { name: '변조' })),
)
await check('비로그인은 고객을 읽지 못한다', () => assertFails(getDoc(doc(anon, 'contacts/c1'))))
await check('소상공인은 고객을 만들지 못한다 (role 게이트)', () =>
  assertFails(setDoc(doc(merchant, 'contacts/c2'), { ownerAgentId: 'merchant1' })),
)
await check('설계사도 남을 소유자로 지정해 만들지 못한다', () =>
  assertFails(setDoc(doc(agentA, 'contacts/c3'), { ownerAgentId: 'agentB' })),
)
await check('소유 설계사는 상담로그를 읽는다', () =>
  assertSucceeds(getDoc(doc(agentA, 'contacts/c1/interactions/i1'))),
)
await check('다른 설계사는 상담로그를 읽지 못한다', () =>
  assertFails(getDoc(doc(agentB, 'contacts/c1/interactions/i1'))),
)

console.log('\nusers — 권한 상승 차단 (docs/03 §4.1)')
await check('본인은 자기 문서를 읽는다', () => assertSucceeds(getDoc(doc(agentA, 'users/agentA'))))
await check('남의 사용자 문서는 읽지 못한다', () =>
  assertFails(getDoc(doc(agentB, 'users/agentA'))),
)
await check('★ 클라이언트가 role 을 직접 못 바꾼다', () =>
  assertFails(updateDoc(doc(agentA, 'users/agentA'), { role: 'admin' })),
)
await check('★ 클라이언트가 isAdmin 을 못 올린다', () =>
  assertFails(updateDoc(doc(agentA, 'users/agentA'), { isAdmin: true })),
)
await check('★ 클라이언트가 agentId 를 못 바꾼다', () =>
  assertFails(updateDoc(doc(agentA, 'users/agentA'), { agentId: 'agentB' })),
)
await check('일반 필드는 본인이 바꿀 수 있다', () =>
  assertSucceeds(updateDoc(doc(agentA, 'users/agentA'), { palette: 'gyul' })),
)

console.log('\nanonymousPosts — 작성자 역추적 차단 (docs/02 §5)')
await check('★ 로그인해도 익명글을 직접 읽지 못한다', () =>
  assertFails(getDoc(doc(merchant, 'anonymousPosts/p1'))),
)
await check('★ 관리자조차 클라이언트에서 읽지 못한다 (서버 경유만)', () =>
  assertFails(getDoc(doc(admin, 'anonymousPosts/p1'))),
)
await check('익명글 수정·삭제는 아무도 못 한다', () =>
  assertFails(deleteDoc(doc(merchant, 'anonymousPosts/p1'))),
)

console.log('\nauditLogs — 감사 기록 보존 (docs/09 §2.9)')
await check('관리자는 감사 로그를 읽는다', () => assertSucceeds(getDoc(doc(admin, 'auditLogs/a1'))))
await check('비관리자는 감사 로그를 읽지 못한다', () =>
  assertFails(getDoc(doc(agentA, 'auditLogs/a1'))),
)
await check('★ 관리자도 감사 로그를 지우지 못한다', () =>
  assertFails(deleteDoc(doc(admin, 'auditLogs/a1'))),
)

console.log('\nstores — 공개 범위')
await check('비로그인도 공개 매장은 읽는다', () =>
  assertSucceeds(getDoc(doc(anon, 'stores/public1'))),
)
await check('비로그인은 비공개 매장을 읽지 못한다', () =>
  assertFails(getDoc(doc(anon, 'stores/draft1'))),
)

await env.cleanup()

console.log(`\n통과 ${passed} / 실패 ${failed}`)
if (failed > 0) process.exit(1)
