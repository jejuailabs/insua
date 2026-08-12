'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Link } from '@/lib/i18n/navigation'

/**
 * 라우트 단위 에러 경계 (docs/11 M8).
 * 사과하지 않고 무엇이 일어났고 어떻게 하면 되는지만 말한다 (docs/04 §9).
 * 스택 트레이스나 원문 에러는 화면에 절대 내지 않는다 (docs/12 §5).
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()

  useEffect(() => {
    // digest 는 서버 로그와 대조하기 위한 식별자다. 본문·개인정보는 담기지 않는다.
    console.error('[error-boundary]', error.digest ?? error.name)
  }, [error])

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-title text-content">{t('errorPage.title')}</h1>
      <p className="mt-2 text-body text-content-muted">{t('errorPage.body')}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-chip bg-accent-strong px-5 py-3 text-label text-accent-on"
        >
          {t('common.retry')}
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-chip border border-line px-5 py-3 text-label text-content-muted"
        >
          {t('errorPage.home')}
        </Link>
      </div>
    </main>
  )
}
