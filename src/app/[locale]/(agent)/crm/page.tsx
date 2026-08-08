import { setRequestLocale } from 'next-intl/server'
import { StubScreen } from '@/components/layout/StubScreen'
import { requireRolePage } from '@/lib/auth/guards'

/** M4 에서 실제 CRM 화면으로 교체된다 (docs/06). */
export default async function CrmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['agent'])

  return <StubScreen titleKey="crm.title" />
}
