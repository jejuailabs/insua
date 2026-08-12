'use client'

import { useEffect } from 'react'
import '@/styles/globals.css'

/**
 * 루트 레이아웃 자체가 죽었을 때의 최후 경계 (docs/11 M8).
 *
 * 이 컴포넌트는 레이아웃을 대체하므로 `<html>`/`<body>` 를 직접 그려야 한다.
 * i18n 프로바이더도 없는 상태라 **번역을 쓸 수 없다.** 여기서만 문자열이 하드코딩되는 이유다
 * (CLAUDE.md §3-3 의 불가피한 예외 — 번역 계층이 존재하지 않는 지점).
 * 그래서 문구를 한국어·영어 두 줄로 함께 둔다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error.digest ?? error.name)
  }, [error])

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
          <h1 className="text-title text-content">화면을 불러오지 못했습니다</h1>
          <p className="mt-1 text-caption text-content-muted">This screen did not load</p>
          <p className="mt-3 text-body text-content-muted">
            일시적인 문제일 수 있습니다. 다시 시도해 보세요.
          </p>

          <button
            type="button"
            onClick={reset}
            className="mt-8 min-h-11 self-start rounded-chip bg-accent-strong px-5 py-3 text-label text-accent-on"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  )
}
