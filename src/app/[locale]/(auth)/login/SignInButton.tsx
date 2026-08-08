'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { completeRedirectSignIn, signInWithGoogle } from '@/lib/auth/signIn'
import { cn } from '@/lib/utils/cn'

type ErrorKey = 'popupBlocked' | 'network' | 'forbidden'

function toErrorKey(error: unknown): ErrorKey {
  const code = (error as { code?: string }).code ?? ''
  if (code.includes('popup')) return 'popupBlocked'
  if (code.includes('network')) return 'network'
  return 'network'
}

export function SignInButton({ next }: { next: string }) {
  const t = useTranslations('auth')
  const router = useRouter()
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

      // 세션 쿠키가 생겼으니 서버가 역할을 보고 보낼 곳을 정한다.
      router.replace(next)
      router.refresh()
    } catch (error) {
      setErrorKey(toErrorKey(error))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={busy}
        className={cn(
          'rounded-chip bg-accent-strong px-5 py-3 text-label text-accent-on',
          'min-h-11 transition-opacity disabled:opacity-60',
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
  )
}
