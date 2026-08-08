/**
 * 개발용 테스트 세션 발급기 (개발 도구 — 앱 런타임 아님)
 *
 *   node scripts/dev-session.mts agent      # 역할별 테스트 유저의 ID 토큰 출력
 *   node scripts/dev-session.mts merchant
 *   node scripts/dev-session.mts consumer
 *
 * 보호된 화면(/crm /home /feed)을 구글 로그인 없이 로컬에서 확인하기 위한 도구다.
 * Admin SDK 로 테스트 유저(dev-{role}@test.local)를 만들고 role 클레임을 박은 뒤,
 * 커스텀 토큰 → ID 토큰 교환(Identity Toolkit REST)까지 해서 ID 토큰을 준다.
 * 이 토큰을 POST /api/session 에 넘기면 세션 쿠키가 나온다.
 *
 * 프로덕션 사용자 데이터는 건드리지 않는다. 테스트 유저 3개만 만든다.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

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

async function main() {
  const role = process.argv[2]
  if (!role || !['agent', 'merchant', 'consumer'].includes(role)) {
    throw new Error('사용법: node scripts/dev-session.mts <agent|merchant|consumer>')
  }

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
  const auth = getAuth(app)

  const email = `dev-${role}@test.local`
  let uid: string
  try {
    uid = (await auth.getUserByEmail(email)).uid
  } catch {
    uid = (await auth.createUser({ email, displayName: `dev-${role}` })).uid
  }
  await auth.setCustomUserClaims(uid, { role })

  const customToken = await auth.createCustomToken(uid)
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${e.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  )
  if (!res.ok) throw new Error(`토큰 교환 실패: ${res.status} ${(await res.text()).slice(0, 200)}`)
  const { idToken } = await res.json()
  console.log(idToken)
}

main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`)
  process.exitCode = 1
})
