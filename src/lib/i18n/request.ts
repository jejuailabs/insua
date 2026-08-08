import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

type Messages = { [key: string]: string | Messages }

/**
 * ko 를 베이스로 깔고 그 위에 해당 언어를 덮는다.
 * docs/05 §1 — zh/ja 는 슬롯만 확보된 상태라 번역이 비어 있어도 ko 로 떨어져야 한다.
 * 이 병합이 없으면 키 하나 빠질 때마다 MISSING_MESSAGE 로 화면이 깨진다.
 * 무엇이 비었는지는 `pnpm i18n:check` 가 알려준다 (docs/05 §6).
 */
function mergeWithBase(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key]
    out[key] =
      typeof value === 'object' && typeof baseValue === 'object'
        ? mergeWithBase(baseValue, value)
        : value
  }
  return out
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const base = (await import(`../../../messages/${routing.defaultLocale}.json`)).default as Messages
  const messages =
    locale === routing.defaultLocale
      ? base
      : mergeWithBase(base, (await import(`../../../messages/${locale}.json`)).default as Messages)

  return { locale, messages }
})
