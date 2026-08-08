'use client'

import { LogIn, ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getMyRole } from '@/lib/auth/setRole'
import { completeRedirectSignIn, signInWithGoogle } from '@/lib/auth/signIn'
import { cn } from '@/lib/utils/cn'
import { ROLE_HOME, type Role } from '@/types/user'
import { Modal } from '@/components/ui/Modal'
import { RoleCards } from './RoleCards'

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
 * 흐름: 로그인 모달 → 구글 → 역할 없으면 역할 모달 → 역할별 홈.
 *
 * `role` 은 **서버가 세션 쿠키를 검증해서 내려준 값**이다. 화면 분기용일 뿐,
 * 실제 권한은 서버와 Security Rules 가 다시 본다 (CLAUDE.md §3-2).
 */
export function AuthLauncher({ signedIn, role }: { signedIn: boolean; role: Role | null }) {
  const t = useTranslations('auth')
  const tOnboarding = useTranslations('onboarding')
  const router = useRouter()
  const locale = useLocale()

  const [loginOpen, setLoginOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  async function handleSignIn() {
    setBusy(true)
    setErrorKey(null)
    try {
      // 리다이렉트 폴백으로 돌아온 경우를 먼저 흡수한다. 없으면 null 이라 그냥 진행한다.
      const resumed = await completeRedirectSignIn().catch(() => null)
      const outcome = resumed ?? (await signInWithGoogle())
      if (outcome.status === 'redirecting') return // 페이지가 떠난다

      // 세션 쿠키가 생겼으니 이제 서버에 역할을 물어본다.
      const current = await getMyRole()
      setLoginOpen(false)
      setBusy(false)

      if (current) {
        router.replace(`/${locale}${ROLE_HOME[current]}`)
        router.refresh()
        return
      }
      setRoleOpen(true)
    } catch (error) {
      setErrorKey(toErrorKey(error))
      setBusy(false)
    }
  }

  function handleFabClick() {
    if (!signedIn) return setLoginOpen(true)
    if (!role) return setRoleOpen(true)
    router.push(`/${locale}${ROLE_HOME[role]}`)
  }

  const label = signedIn && role ? t('openApp') : t('loginCta')
  const Icon = signedIn && role ? ArrowRight : LogIn

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

      <Modal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title={t('title')}
        description={t('subtitle')}
      >
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

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={tOnboarding('title')}
        description={tOnboarding('subtitle')}
      >
        <RoleCards locale={locale} />
      </Modal>
    </>
  )
}
