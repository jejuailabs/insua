import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PaletteScript } from '@/components/theme/PaletteScript'
import { Providers } from '@/components/theme/Providers'
import { routing } from '@/lib/i18n/routing'
import '@/styles/globals.css'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    // TODO(confirm): 서비스 정식 명칭 미확정. 코드네임이라 번역 대상이 아니다 (CLAUDE.md §7)
    title: 'local-os',
    // 검색결과·공유카드에 노출되는 실제 사용자 텍스트다. 반드시 번역을 거친다 (CLAUDE.md §3-3)
    description: t('description'),
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // 정적 렌더링을 위해 필요하다. 빼면 이 하위가 전부 동적 렌더로 떨어진다.
  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* next-themes 보다 먼저, 동기적으로 data-palette 를 붙인다 (docs/04 §6.2) */}
        <PaletteScript />
      </head>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
