'use client'

import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

/** 팝업이 막히는 환경(모바일 웹뷰, 팝업 차단) — 리다이렉트로 폴백한다 (docs/03 §2). */
const POPUP_UNAVAILABLE = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/cancelled-popup-request',
])

function googleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

/** ID 토큰을 서버로 보내 HttpOnly 세션 쿠키를 받는다. */
async function createServerSession(user: FirebaseUser) {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('SESSION_CREATE_FAILED')
}

export type SignInOutcome = { status: 'signed-in' } | { status: 'redirecting' }

export async function signInWithGoogle(): Promise<SignInOutcome> {
  try {
    const cred = await signInWithPopup(auth, googleProvider())
    await createServerSession(cred.user)
    return { status: 'signed-in' }
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code && POPUP_UNAVAILABLE.has(code)) {
      await signInWithRedirect(auth, googleProvider())
      return { status: 'redirecting' }
    }
    throw error
  }
}

/**
 * 리다이렉트 폴백으로 돌아왔을 때 호출한다.
 * 결과가 없으면(평범한 방문) null 을 준다.
 */
export async function completeRedirectSignIn(): Promise<SignInOutcome | null> {
  const result = await getRedirectResult(auth)
  if (!result) return null
  await createServerSession(result.user)
  return { status: 'signed-in' }
}

/** docs/03 §6 — 서버 쿠키를 먼저 지우고 클라이언트 세션을 지운다. */
export async function signOutEverywhere() {
  await fetch('/api/session', { method: 'DELETE' })
  await signOut(auth)
}

/**
 * 커스텀 클레임이 바뀐 뒤에는 기존 ID 토큰에 반영되지 않는다 (docs/03 §3).
 * 강제 갱신해서 세션 쿠키를 다시 발급받아야 한다.
 */
export async function refreshSessionAfterClaimChange() {
  const user = auth.currentUser
  if (!user) throw new Error('UNAUTHENTICATED')
  await user.getIdToken(true)
  await createServerSession(user)
}
