import { Clock, MapPin, MessageSquareText, Star } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapEmbed } from '@/components/store/MapEmbed'
import { PublicActionBar } from '@/components/store/PublicActionBar'
import { TierBadge } from '@/components/ui/TierBadge'
import { MENU_SECTION_KEY } from '@/lib/mock/store'
import { getStoreForLanding } from '@/lib/stores/data'

export const revalidate = 300

/**
 * 공개 매장 페이지 (docs/07 B-4). 비로그인 접근 가능 — proxy 보호 목록에 없다.
 * 편집 UI(모듈 수정·컴포저)는 여기 절대 섞이지 않는다. 액션 바만 있다.
 * 실데이터가 붙으면 ISR(revalidate 300)로 전환한다.
 */
export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ locale: string; storeId: string }>
}) {
  const { locale, storeId } = await params
  setRequestLocale(locale)

  const store = await getStoreForLanding(storeId)
  if (!store) notFound()

  const t = await getTranslations()

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">
        <article className="relative aspect-[4/5] overflow-hidden rounded-card border border-line">
          <Image
            src={store.heroImage}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, 420px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35" />
          <span className="absolute top-3 right-3">
            <TierBadge tier={store.tier} />
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4 text-right">
            <h1 className="text-display text-white">{store.name}</h1>
            <p className="mt-1 text-body text-white/85">{store.tagline}</p>
            <p className="mt-2.5 flex items-center justify-end gap-3 text-label text-white">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-current text-warning" aria-hidden />
                <span className="tabular">
                  {t('format.rating', { rating: store.rating, count: store.ratingCount })}
                </span>
              </span>
              <span className="flex items-center gap-1 text-white/85">
                <MessageSquareText size={13} aria-hidden />
                {t('format.reviewCount', { count: store.reviewCount })}
              </span>
            </p>
            <p className="tabular mt-2 flex items-center justify-end gap-1.5 text-label text-white/90">
              <Clock size={13} aria-hidden />
              {store.hours.open} - {store.hours.close}
            </p>
            <p className="mt-1 flex items-center justify-end gap-1.5 text-label text-white/90">
              <MapPin size={13} aria-hidden />
              {store.address}
            </p>
          </div>
        </article>

        <section className="mt-6">
          <h2 className="text-subtitle text-content">{t(MENU_SECTION_KEY[store.category])}</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {store.menus.map((menu) => (
              <li
                key={menu.id}
                className="overflow-hidden rounded-inner border border-line bg-surface"
              >
                <div className="relative aspect-square">
                  <Image src={menu.image} alt="" fill sizes="33vw" className="object-cover" />
                </div>
                <div className="p-2">
                  <p className="truncate text-label text-content">{menu.name}</p>
                  <p className="tabular mt-0.5 text-label text-content">
                    {t('format.currency', { amount: menu.price.toLocaleString() })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-subtitle text-content">{t('merchant.storeIntro')}</h2>
          <div className="mt-2 flex gap-3">
            <p className="flex-1 text-body whitespace-pre-line text-content">{store.intro}</p>
            <MapEmbed address={store.address} />
          </div>
        </section>
      </main>

      <PublicActionBar store={store} />
    </>
  )
}
