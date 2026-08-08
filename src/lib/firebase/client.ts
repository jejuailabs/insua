'use client'

import { getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

/**
 * docs/01 §6.
 * 여기 값들은 전부 공개 식별자다. NEXT_PUBLIC_FIREBASE_API_KEY 는 비밀값이 아니며,
 * 실제 보호는 Security Rules + 승인된 도메인 설정이 한다.
 * 반대로 FIREBASE_PRIVATE_KEY 는 서버 전용이다. 이 파일에 절대 들어오면 안 된다.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

export const app = getApps().length ? getApps()[0]! : initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// docs/01 §7 — 에뮬레이터는 명시적으로 켤 때만 붙는다.
// HMR 로 이 모듈이 다시 평가돼도 두 번 연결하지 않도록 전역 플래그를 쓴다.
declare global {
  var __firebaseEmulatorsConnected: boolean | undefined
}

if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' && !globalThis.__firebaseEmulatorsConnected) {
  globalThis.__firebaseEmulatorsConnected = true
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
