import 'server-only'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * docs/01 §6. **클라이언트 번들에 절대 들어가면 안 된다.**
 * `server-only` import 가 안전장치다 — 클라이언트에서 끌어다 쓰면 빌드가 실패한다.
 */
function createApp(): App {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!privateKey || !projectId || !clientEmail) {
    // 어떤 값이 비었는지만 알린다. 값 자체는 절대 로그에 남기지 않는다 (docs/12 §5).
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean)
    throw new Error(`FIREBASE_ADMIN_ENV_MISSING: ${missing.join(', ')}`)
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // 환경변수에는 개행이 \n 으로 이스케이프돼 들어온다 (docs/01 §4).
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

const app = getApps().length ? getApps()[0]! : createApp()

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
