'use client'

import { Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { applyMerchant } from '@/lib/consumer/actions'

/** 소상공인 전환 신청 (사용자 확정 사양) — 승인은 관리자가 콘솔에서. */
export function ApplyMerchantButton({ applied }: { applied: boolean }) {
  const t = useTranslations('consumer')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (applied || done) {
    return (
      <p className="rounded-chip bg-accent-soft px-3 py-2.5 text-label text-accent-strong">
        {done ? t('applyDone') : t('applyPending')}
      </p>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await applyMerchant()
          if (result.ok) {
            setDone(true)
            router.refresh()
          }
        })
      }
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
    >
      <Store size={16} aria-hidden />
      {t('applyMerchant')}
    </button>
  )
}
