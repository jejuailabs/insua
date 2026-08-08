import { defineRouting } from 'next-intl/routing'

/**
 * docs/05 §2.
 * localePrefix: 'always' — 기본 언어도 /ko 를 붙인다.
 * 'as-needed' 를 쓰면 기본 언어 URL 만 비대칭이 되어 공유 링크가 헷갈린다.
 */
export const routing = defineRouting({
  locales: ['ko', 'en', 'zh', 'ja'],
  defaultLocale: 'ko',
  localePrefix: 'always',
  localeDetection: true, // Accept-Language 기반 최초 1회 감지
})

export type Locale = (typeof routing.locales)[number]

/**
 * 언어 전환 드롭다운 표기 (docs/05 §7).
 * 각 언어를 **해당 언어로** 적는다. "Korean" 처럼 현재 언어로 번역하지 않는다.
 * 번역 대상이 아니므로 messages/ 가 아니라 여기에 둔다.
 */
export const LOCALE_LABEL: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
}
