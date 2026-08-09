'use client'

import { MapPinned, Phone, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { Store } from '@/lib/mock/store'

/** 공개 매장 페이지 하단 액션 바 (docs/07 B-4) — 컴포저 대신 전화/길찾기/공유. */
export function PublicActionBar({ store }: { store: Store }) {
  const t = useTranslations('merchant')
  const [toast, setToast] = useState<string | null>(null)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, url })
        return
      }
      throw new Error('unsupported')
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {})
      setToast(t('shareCopied'))
      setTimeout(() => setToast(null), 2000)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md gap-2 px-4 py-3 lg:max-w-3xl">
          <a
            href={`tel:${store.phone}`}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on"
          >
            <Phone size={16} aria-hidden />
            {t('call')}
          </a>
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-chip border border-line text-label text-content"
          >
            <MapPinned size={16} aria-hidden />
            {t('directions')}
          </a>
          <button
            type="button"
            onClick={share}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-chip border border-line text-label text-content"
          >
            <Share2 size={16} aria-hidden />
            {t('share')}
          </button>
        </div>
      </div>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
