'use client'

import { ArrowLeft, Share2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { LocalHeroMark } from '@/components/brand/LocalHeroLogo'

/**
 * 랜딩 상단 바 (사용자 지적 반영).
 * 이 화면은 검색·공유로 바로 들어오는 **랜딩페이지**라 앱 레일이 없다.
 * 그래서 나갈 길을 상단이 직접 준다 — 뒤로(히스토리 없으면 홈), 로고(홈), 섹션 이동, 공유.
 */
export function LandingNav({
  storeName,
  sections,
}: {
  storeName: string
  sections: Array<{ id: string; label: string }>
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  function goBack() {
    // 검색 결과에서 바로 들어온 경우 뒤로 갈 곳이 없다 — 그때는 홈으로 보낸다.
    if (window.history.length > 1) router.back()
    else router.push(`/${locale}`)
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: storeName, url })
        return
      }
      throw new Error('unsupported')
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {})
      setToast(t('merchant.shareCopied'))
      setTimeout(() => setToast(null), 2000)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
          <button
            type="button"
            onClick={goBack}
            aria-label={t('common.previous')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-chip text-content-muted hover:bg-surface-2"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>

          <Link
            href={`/${locale}`}
            aria-label={t('nav.feed')}
            className="flex shrink-0 items-center gap-1.5"
          >
            <LocalHeroMark size={24} />
            <span className="hidden text-label text-[var(--brand-ink)] sm:inline">LOCAL HERO</span>
          </Link>

          {/* 섹션 이동 — 한 페이지짜리 랜딩의 목차 */}
          <nav className="flex min-w-0 flex-1 [scrollbar-width:none] justify-end gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="shrink-0 rounded-pill px-2.5 py-1.5 text-caption text-content-muted hover:bg-surface-2"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={share}
            aria-label={t('merchant.share')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-chip text-content-muted hover:bg-surface-2"
          >
            <Share2 size={18} aria-hidden />
          </button>
        </div>
      </header>

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
