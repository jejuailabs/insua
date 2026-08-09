'use client'

import { LogIn, ArrowRight, ShieldCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getMyAccess, setRole } from '@/lib/auth/setRole'
import {
  completeRedirectSignIn,
  refreshSessionAfterClaimChange,
  signInWithGoogle,
} from '@/lib/auth/signIn'
import { cn } from '@/lib/utils/cn'
import { ROLE_HOME, type Role } from '@/types/user'
import { Modal } from '@/components/ui/Modal'

type ErrorKey = 'popupBlocked' | 'network' | 'forbidden'

function toErrorKey(error: unknown): ErrorKey {
  const code = (error as { code?: string }).code ?? ''
  if (code.includes('popup')) return 'popupBlocked'
  return 'network'
}

/**
 * 메인 우측 하단 플로팅 버튼 + 로그인/역할선택 모달 (docs/03 §1·§2).
 *
 * 메인은 로그인 없이도 다 보인다. 로그인은 이 버튼에서만 시작하고, 화면을 갈아엎지 않는다.
 * 흐름: 로그인 모달 → 구글 → (어드민이면 콘솔로) → 역할 없으면 역할 모달 → 역할별 홈.
 * 보호 화면에 비로그인으로 접근하면 `?login=1` 로 돌아와 로그인 모달이 바로 열린다.
 *
 * `role`/`isAdmin` 은 **서버가 세션 쿠키를 검증해서 내려준 값**이다. 화면 분기용일 뿐,
 * 실제 권한은 서버와 Security Rules 가 다시 본다 (CLAUDE.md §3-2).
 */
export function AuthLauncher({
  signedIn,
  role,
  isAdmin = false,
  initialLoginOpen = false,
}: {
  signedIn: boolean
  role: Role | null
  isAdmin?: boolean
  initialLoginOpen?: boolean
}) {
  const t = useTranslations('auth')
  const tAdmin = useTranslations('admin')
  const router = useRouter()
  const locale = useLocale()

  // ?login=1 로 돌아온 비로그인 사용자는 로그인 모달이 바로 열린다.
  const [loginOpen, setLoginOpen] = useState(initialLoginOpen && !signedIn)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  function closeLogin() {
    setLoginOpen(false)
    // ?login=1 을 지워 새로고침 시 모달이 다시 열리지 않게 한다.
    if (initialLoginOpen) router.replace(`/${locale}`)
  }

  async function handleSignIn() {
    setBusy(true)
    setErrorKey(null)
    try {
      // 리다이렉트 폴백으로 돌아온 경우를 먼저 흡수한다. 없으면 null 이라 그냥 진행한다.
      const resumed = await completeRedirectSignIn().catch(() => null)
      const outcome = resumed ?? (await signInWithGoogle())
      if (outcome.status === 'redirecting') return // 페이지가 떠난다

      // 세션 쿠키가 생겼으니 이제 서버에 권한을 물어본다.
      const access = await getMyAccess()

      if (access.isAdmin && !access.role) {
        setLoginOpen(false)
        setBusy(false)
        router.replace(`/${locale}/admin`)
        router.refresh()
        return
      }

      // 역할 선택 화면은 없다 (사용자 확정 사양 v2):
      // 신규 가입자는 자동으로 일반인(consumer)이 된다. 소상공인은 마이페이지에서
      // 신청하고, 설계사는 관리자가 콘솔에서 부여한다.
      if (!access.role) {
        await setRole('consumer')
        await refreshSessionAfterClaimChange()
        setLoginOpen(false)
        setBusy(false)
        router.replace(`/${locale}${ROLE_HOME.consumer}`)
        router.refresh()
        return
      }

      setLoginOpen(false)
      setBusy(false)
      router.replace(`/${locale}${ROLE_HOME[access.role]}`)
      router.refresh()
    } catch (error) {
      setErrorKey(toErrorKey(error))
      setBusy(false)
    }
  }

  function handleFabClick() {
    if (!signedIn) return setLoginOpen(true)
    if (isAdmin && !role) return router.push(`/${locale}/admin`)
    router.push(`/${locale}${ROLE_HOME[role ?? 'consumer']}`)
  }

  const label = signedIn
    ? isAdmin && !role
      ? tAdmin('title')
      : role
        ? t('openApp')
        : t('loginCta')
    : t('loginCta')
  const Icon = signedIn ? (isAdmin && !role ? ShieldCheck : ArrowRight) : LogIn

  return (
    <>
      <button
        type="button"
        onClick={handleFabClick}
        className={cn(
          'fixed right-4 bottom-4 z-40 flex min-h-12 items-center gap-2',
          'rounded-pill bg-accent-strong px-5 text-label text-accent-on shadow-card',
          'transition-opacity hover:opacity-90',
          // 모바일 하단 안전영역(홈 인디케이터) 위로 띄운다
          'mb-[env(safe-area-inset-bottom)]',
        )}
      >
        <Icon size={18} aria-hidden />
        {label}
      </button>

      <Modal open={loginOpen} onClose={closeLogin} title={t('title')} description={t('subtitle')}>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className={cn(
              'min-h-12 w-full rounded-chip bg-accent-strong px-5 text-label text-accent-on',
              'transition-opacity disabled:opacity-60',
            )}
          >
            {busy ? t('signingIn') : t('signInWithGoogle')}
          </button>

          {errorKey && (
            <p role="alert" className="text-caption text-danger">
              {t(`error.${errorKey}`)}
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
