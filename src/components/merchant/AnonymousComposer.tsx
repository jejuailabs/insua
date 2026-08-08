'use client'

import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createAnonymousPost } from '@/lib/merchant/actions'

/** 익명방 글쓰기 — 항상 익명. 전송 후 목록을 새로 고친다. */
export function AnonymousComposer() {
  const t = useTranslations('anonymous')
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  function submit() {
    if (!body.trim() || pending) return
    startTransition(async () => {
      const result = await createAnonymousPost(body)
      if (result.ok) {
        setBody('')
        setToast(t('posted'))
        setTimeout(() => setToast(null), 2000)
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={t('writePlaceholder')}
          className="min-h-11 flex-1 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || pending}
          aria-label={t('post')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on disabled:opacity-50"
        >
          <Send size={18} aria-hidden />
        </button>
      </div>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </div>
  )
}
