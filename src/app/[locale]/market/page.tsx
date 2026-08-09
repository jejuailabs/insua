import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProductGrid } from '@/components/home/ProductGrid'
import { SideRail } from '@/components/layout/SideRail'
import { ProductRegisterButton } from '@/components/market/ProductRegisterButton'
import { getSession } from '@/lib/auth/session'
import { listProducts } from '@/lib/market/data'

export const maxDuration = 60

/**
 * 마켓 (docs/08 §3 + 쇼핑몰 사양).
 * 상품 등록은 설계사·관리자만 (서버 세션 판정). 노출은 전체 공개.
 * 상품을 누르면 쇼핑몰 구조의 상세 페이지로 간다.
 */
export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const [session, products] = await Promise.all([getSession(), listProducts()])
  const canRegister = session?.role === 'agent' || session?.isAdmin === true

  return (
    <div className="flex">
      <SideRail variant="consumer" active="market" homeHref="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10 lg:max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-display text-content">{t('nav.market')}</h1>
          {canRegister && <ProductRegisterButton />}
        </div>

        {/* PC 쇼핑몰 수준의 큰 카드 (사용자 확정 사양) */}
        <ProductGrid items={products} large />
      </main>
    </div>
  )
}
