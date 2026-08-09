import { Heart, Star } from 'lucide-react'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { consumerRail } from '@/components/home/consumerRail'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { getMyConsumerProfile } from '@/lib/consumer/actions'
import { Link } from '@/lib/i18n/navigation'
import { HEROES } from '@/lib/mock/home'

/** 찜한가게 (docs/08 §8) — users/{uid}/saved 실데이터. */
export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  const profile = await getMyConsumerProfile()
  const saved = HEROES.filter((hero) => profile?.savedStoreIds.includes(hero.id))
  const t = await getTranslations()

  return (
    <div className="flex">
      <SideRail items={consumerRail('saved', '/feed')} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
        <AdminPeekBanner />
        <h1 className="text-display text-content">{t('nav.saved')}</h1>

        {saved.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-10 text-center">
            <Heart size={32} aria-hidden className="text-content-faint" />
            <p className="text-body text-content-muted">{t('consumer.savedEmpty')}</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {saved.map((hero) => (
              <li key={hero.id}>
                <Link
                  href={`/s/${hero.id}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-inner">
                    <Image src={hero.image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subtitle text-content">{hero.name}</p>
                    <p className="truncate text-caption text-content-muted">{hero.tagline}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-caption text-content">
                      <Star size={12} className="fill-current text-warning" aria-hidden />
                      <span className="tabular">
                        {t('format.rating', { rating: hero.rating, count: hero.reviews })}
                      </span>
                    </p>
                  </div>
                  <Heart
                    size={18}
                    aria-hidden
                    className="shrink-0 fill-current text-accent-strong"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
