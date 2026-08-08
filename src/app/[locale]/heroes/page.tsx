import { Star } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { consumerRail } from '@/components/home/consumerRail'
import { SideRail } from '@/components/layout/SideRail'
import { Link } from '@/lib/i18n/navigation'
import { HEROES } from '@/lib/mock/home'

/** 히어로 목록 (docs/08 §3) — 공개. 카드를 누르면 공개 매장 페이지로 간다. */
export default async function HeroesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="flex">
      <SideRail items={consumerRail('heroes', '/')} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
        <h1 className="text-display text-content">{t('nav.heroes')}</h1>

        <ul className="mt-4 grid grid-cols-2 gap-3">
          {HEROES.map((hero) => (
            <li key={hero.id}>
              <Link
                href={`/s/${hero.id}`}
                className="block overflow-hidden rounded-card border border-line bg-surface"
              >
                <div className="relative aspect-[4/5]">
                  <Image src={hero.image} alt="" fill sizes="50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute top-2 right-2 rounded-pill bg-black/50 px-2 py-0.5 text-micro text-white">
                    {t(`consumer.category.${hero.category}`)}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-subtitle text-white">{hero.name}</p>
                    <p className="mt-0.5 truncate text-micro text-white/80">{hero.tagline}</p>
                    <p className="mt-1 flex items-center gap-1 text-micro text-white">
                      <Star size={11} className="fill-current text-warning" aria-hidden />
                      <span className="tabular">
                        {t('format.rating', { rating: hero.rating, count: hero.reviews })}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
