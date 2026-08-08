import { setRequestLocale } from 'next-intl/server'
import { StubScreen } from '@/components/layout/StubScreen'
import { requireRolePage } from '@/lib/auth/guards'

/** M5 에서 커뮤니티 대시보드로 교체된다 (docs/07 A). */
export default async function MerchantHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['merchant'])

  return <StubScreen titleKey="merchant.spaceName" />
}
