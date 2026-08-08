'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { LOCALE_LABEL, routing, type Locale } from '@/lib/i18n/routing'

/**
 * 언어 전환 (docs/05 §7).
 * 현재 경로를 유지한 채 locale 만 교체한다.
 * M2 이후 로그인 사용자는 여기서 users.locale 도 함께 갱신한다 (docs/05 §2).
 */
export function LocaleSwitcher() {
  const t = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <label className="inline-flex items-center gap-2 text-label text-content-muted">
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as Locale
          startTransition(() => {
            // usePathname() 은 locale 접두사를 뺀 현재 경로를 실제 값이 채워진 상태로 준다
            // (예: /s/abc123). 그래서 locale 만 갈아끼우면 경로가 그대로 유지된다.
            router.replace(pathname, { locale: next })
          })
        }}
        className="rounded-chip border border-line bg-surface px-3 py-2 text-label text-content"
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {LOCALE_LABEL[value]}
          </option>
        ))}
      </select>
    </label>
  )
}
