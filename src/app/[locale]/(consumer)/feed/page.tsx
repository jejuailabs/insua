import { setRequestLocale } from 'next-intl/server'
import { StubScreen } from '@/components/layout/StubScreen'
import { requireRolePage } from '@/lib/auth/guards'

/** M6 에서 LOCAL HERO 피드로 교체된다 (docs/08). */
export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  return <StubScreen titleKey="consumer.brand" />
}
