import 'server-only'

import { adminAuth, adminDb } from '@/lib/firebase/admin'

/**
 * 최초 관리자 부트스트랩 (docs/03 §4.2).
 *
 * 관리자를 만들 방법이 없으면 시작을 못 하므로 환경변수 화이트리스트로 승격한다.
 * 이후 추가 관리자는 어드민 콘솔에서 지정한다.
 * **운영 배포 후에는 ADMIN_BOOTSTRAP_EMAILS 를 비우는 것을 권장한다.**
 */
export async function applyBootstrapAdmin(uid: string, email: string | undefined) {
  if (!email) return false

  const allowed = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  if (!allowed.includes(email.toLowerCase())) return false

  const existing = (await adminAuth.getUser(uid)).customClaims ?? {}
  await adminAuth.setCustomUserClaims(uid, { ...existing, admin: true })
  await adminDb.collection('users').doc(uid).update({ isAdmin: true, updatedAt: new Date() })
  return true
}
