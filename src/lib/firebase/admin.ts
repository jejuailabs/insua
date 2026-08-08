import 'server-only'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * docs/01 §6. **클라이언트 번들에 절대 들어가면 안 된다.**
 * `server-only` import 가 안전장치다 — 클라이언트에서 끌어다 쓰면 빌드가 실패한다.
 *
 * 초기화를 **지연**시킨다. 모듈 최상단에서 던지면 환경변수가 하나 빠진 것만으로
 * 이 모듈을 스치는 모든 경로가 500 이 된다 — 로그인과 무관한 공개 랜딩까지.
 * 대신 실제로 Admin 기능을 쓸 때 던지고, 부르는 쪽이 판단하게 한다.
 */
export class AdminNotConfiguredError extends Error {
  constructor(missing: string[]) {
    // 어떤 키가 비었는지만 알린다. 값 자체는 절대 로그에 남기지 않는다 (docs/12 §5).
    super(`FIREBASE_ADMIN_ENV_MISSING: ${missing.join(', ')}`)
    this.name = 'AdminNotConfiguredError'
  }
}

export function isAdminConfigured(): boolean {
  return missingEnv().length === 0
}

function missingEnv(): string[] {
  return [
    !process.env.FIREBASE_PROJECT_ID && 'FIREBASE_PROJECT_ID',
    !process.env.FIREBASE_CLIENT_EMAIL && 'FIREBASE_CLIENT_EMAIL',
    !process.env.FIREBASE_PRIVATE_KEY && 'FIREBASE_PRIVATE_KEY',
  ].filter((entry): entry is string => Boolean(entry))
}

function createApp(): App {
  const missing = missingEnv()
  if (missing.length) throw new AdminNotConfiguredError(missing)

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      // 환경변수에는 개행이 \n 으로 이스케이프돼 들어온다 (docs/01 §4).
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

let cached: { auth: Auth; db: Firestore } | null = null

function ensureAdmin() {
  if (cached) return cached
  const app = getApps().length ? getApps()[0]! : createApp()
  cached = { auth: getAuth(app), db: getFirestore(app) }
  return cached
}

export function getAdminAuth(): Auth {
  return ensureAdmin().auth
}

export function getAdminDb(): Firestore {
  return ensureAdmin().db
}
