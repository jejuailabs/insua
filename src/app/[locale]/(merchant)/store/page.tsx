import { setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { StoreScreen } from '@/components/store/StoreScreen'
import { requireRolePage } from '@/lib/auth/guards'
import { STORES } from '@/lib/mock/store'

/** 내 매장 — 업주 편집 화면 (ref-01, docs/07 B). 공개 화면은 /s/[storeId]. */
export default async function StorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['merchant'])

  return (
    <>
      <AdminPeekBanner />
      <StoreScreen stores={STORES} />
    </>
  )
}
