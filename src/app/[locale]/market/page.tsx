import { getTranslations, setRequestLocale } from 'next-intl/server'
import { consumerRail } from '@/components/home/consumerRail'
import { ProductGrid } from '@/components/home/ProductGrid'
import { SideRail } from '@/components/layout/SideRail'
import { CATEGORY_PRODUCTS, type HeroCategory } from '@/lib/mock/home'

/** 마켓 (docs/08 §3) — 공개. 업종별 섹션을 전부 편다. */
export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const categories = Object.keys(CATEGORY_PRODUCTS) as HeroCategory[]

  return (
    <div className="flex">
      <SideRail items={consumerRail('market', '/')} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
        <h1 className="text-display text-content">{t('nav.market')}</h1>

        {categories.map((category) => (
          <section key={category} className="mt-6">
            <h2 className="text-subtitle text-content">
              {t(`consumer.productSection.${category}`)}
            </h2>
            <ProductGrid items={CATEGORY_PRODUCTS[category]} />
          </section>
        ))}
      </main>
    </div>
  )
}
