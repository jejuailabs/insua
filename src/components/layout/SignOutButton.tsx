'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { signOutEverywhere } from '@/lib/auth/signIn'

export function SignOutButton() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await signOutEverywhere()
        router.replace(`/${locale}`)
        router.refresh()
      }}
      className="min-h-11 rounded-chip border border-line px-4 py-2 text-label text-content-muted disabled:opacity-60"
    >
      {t('signOut')}
    </button>
  )
}
