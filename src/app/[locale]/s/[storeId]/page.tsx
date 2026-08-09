import { Clock, MapPin, MessageSquareText, Phone, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { LandingNav } from '@/components/store/LandingNav'
import { MapEmbed } from '@/components/store/MapEmbed'
import { ReviewSection } from '@/components/store/ReviewSection'
import { PublicActionBar } from '@/components/store/PublicActionBar'
import { TierBadge } from '@/components/ui/TierBadge'
import { MENU_SECTION_KEY } from '@/lib/mock/store'
import { getSession } from '@/lib/auth/session'
import { listReviews } from '@/lib/reviews/data'
import { getStoreForLanding } from '@/lib/stores/data'

/**
 * 매장 랜딩페이지 (사용자 확정 사양).
 *
 * 앱 화면이 아니라 **검색·공유로 바로 들어오는 단독 랜딩**이다. 그래서
 * (1) 상단 바가 나갈 길과 목차를 직접 주고,
 * (2) 히어로 → 한눈에 → 소개 → 메뉴 → 오시는 길 → FAQ → 후기 → CTA 로 흐르며,
 * (3) AI가 발행한 SEO 카피와 구조화 데이터(JSON-LD)로 검색·AI 답변에 걸린다.
 */

export const revalidate = 600

async function load(storeId: string) {
  const store = await getStoreForLanding(storeId)
  return store
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; storeId: string }>
}): Promise<Metadata> {
  const { locale, storeId } = await params
  const store = await load(storeId)
  if (!store) return {}

  const seo = store.seo
  const title = seo?.metaTitle || `${store.name} · ${store.tagline}`
  const description = seo?.metaDescription || store.intro || store.tagline
  const keywords = [...(seo?.keywords ?? []), ...(seo?.longTailKeywords ?? [])]
  const url = `https://insua.vercel.app/${locale}/s/${storeId}`

  return {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: store.heroImage ? [{ url: store.heroImage }] : undefined,
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: store.heroImage ? [store.heroImage] : undefined,
    },
  }
}

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ locale: string; storeId: string }>
}) {
  const { locale, storeId } = await params
  setRequestLocale(locale)

  const store = await load(storeId)
  if (!store) notFound()

  const [reviews, session, t] = await Promise.all([
    listReviews(storeId),
    getSession(),
    getTranslations(),
  ])

  const seo = store.seo
  const sections = [
    { id: 'about', label: t('merchant.landingAbout') },
    { id: 'menu', label: t('merchant.landingMenu') },
    { id: 'map', label: t('merchant.landingMap') },
    ...(seo?.faq?.length ? [{ id: 'faq', label: t('merchant.landingFaq') }] : []),
    { id: 'reviews', label: t('merchant.landingReviews') },
  ]

  /**
   * 구조화 데이터 — 검색엔진과 AI 답변엔진이 읽는 사실 원본.
   * 화면의 문장이 아무리 좋아도 이게 없으면 리치결과·AI 인용에서 밀린다.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': store.category === 'restaurant' ? 'Restaurant' : 'LocalBusiness',
        '@id': `https://insua.vercel.app/${locale}/s/${storeId}`,
        name: store.name,
        description: seo?.metaDescription || store.intro || store.tagline,
        image: store.heroImage || undefined,
        address: { '@type': 'PostalAddress', streetAddress: store.address, addressCountry: 'KR' },
        telephone: store.phone || undefined,
        openingHours:
          store.hours.open && store.hours.close
            ? `Mo-Su ${store.hours.open}-${store.hours.close}`
            : undefined,
        ...(store.ratingCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: store.rating,
                reviewCount: store.ratingCount,
              },
            }
          : {}),
        ...(store.menus.length
          ? {
              hasMenu: {
                '@type': 'Menu',
                hasMenuItem: store.menus.map((m) => ({
                  '@type': 'MenuItem',
                  name: m.name,
                  offers: { '@type': 'Offer', price: m.price, priceCurrency: 'KRW' },
                })),
              },
            }
          : {}),
        ...(store.lat !== undefined && store.lng !== undefined
          ? { geo: { '@type': 'GeoCoordinates', latitude: store.lat, longitude: store.lng } }
          : {}),
      },
      ...(seo?.faq?.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: seo.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]
        : []),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingNav storeName={store.name} sections={sections} />

      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28">
        {/* 히어로 */}
        <article className="relative aspect-[4/5] overflow-hidden rounded-card border border-line sm:aspect-[16/10]">
          <Image
            src={store.heroImage}
            alt={`${store.name} ${store.tagline}`}
            fill
            sizes="(max-width: 768px) 92vw, 768px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />
          <span className="absolute top-3 right-3">
            <TierBadge tier={store.tier} />
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4 text-right sm:p-6">
            <h1 className="text-display text-white">{store.name}</h1>
            <p className="mt-1 text-body text-white/85">{seo?.subheadline || store.tagline}</p>
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

        {/* AI 헤드라인 — 검색결과에서 클릭해 들어온 사람이 첫 화면에서 읽는 문장 */}
        {seo?.headline && (
          <h2 className="mt-6 text-title leading-snug text-content">{seo.headline}</h2>
        )}

        {/* 한눈에 보기 — 답변엔진이 그대로 인용하기 좋은 사실 조각 */}
        {seo?.highlights?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {seo.highlights.map((h) => (
              <li
                key={h}
                className="rounded-pill border border-line bg-surface px-3 py-1.5 text-caption text-content"
              >
                {h}
              </li>
            ))}
          </ul>
        ) : null}

        {/* 소개 — AI 서술형 본문 3섹션 */}
        <section id="about" className="mt-8 scroll-mt-16">
          <h2 className="text-subtitle text-content">{t('merchant.storeIntro')}</h2>
          {seo?.sections?.length ? (
            <div className="mt-3 flex flex-col gap-5">
              {seo.sections.map((s) => (
                <div key={s.heading}>
                  <h3 className="text-label text-accent-strong">{s.heading}</h3>
                  <p className="mt-1.5 text-body leading-relaxed text-content">{s.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-body whitespace-pre-line text-content">{store.intro}</p>
          )}
        </section>

        {/* 메뉴 */}
        {store.menus.length > 0 && (
          <section id="menu" className="mt-8 scroll-mt-16">
            <h2 className="text-subtitle text-content">{t(MENU_SECTION_KEY[store.category])}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {store.menus.map((menu) => (
                <li
                  key={menu.id}
                  className="overflow-hidden rounded-inner border border-line bg-surface"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={menu.image}
                      alt={`${store.name} ${menu.name}`}
                      fill
                      sizes="(max-width: 768px) 45vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-label text-content">{menu.name}</p>
                    <p className="tabular mt-0.5 text-label text-content">
                      {t('format.currency', { amount: menu.price.toLocaleString() })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 오시는 길 */}
        <section id="map" className="mt-8 scroll-mt-16">
          <h2 className="flex items-center gap-1.5 text-subtitle text-content">
            <MapPin size={15} aria-hidden className="text-accent-strong" />
            {t('consumer.directions')}
          </h2>
          <p className="mt-1 text-caption text-content-muted">{store.address}</p>
          <div className="mt-2">
            <MapEmbed address={store.address} wide />
          </div>
          {store.phone && (
            <p className="mt-2 flex items-center gap-1.5 text-caption text-content-muted">
              <Phone size={13} aria-hidden />
              {store.phone}
            </p>
          )}
        </section>

        {/* FAQ — 답변엔진(AEO)용. 화면에도 보이고 JSON-LD 로도 나간다 */}
        {seo?.faq?.length ? (
          <section id="faq" className="mt-8 scroll-mt-16">
            <h2 className="text-subtitle text-content">{t('merchant.landingFaq')}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {seo.faq.map((f) => (
                <details
                  key={f.q}
                  className="rounded-inner border border-line bg-surface px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer list-none text-label text-content">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-body leading-relaxed text-content-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {/* 방문 후기 */}
        <div id="reviews" className="scroll-mt-16">
          <ReviewSection storeId={storeId} reviews={reviews} signedIn={Boolean(session)} />
        </div>

        {store.aiGenerated && (
          <p className="mt-8 text-micro text-content-faint">{t('ai.generatedNotice')}</p>
        )}
      </main>

      <PublicActionBar store={store} />
    </>
  )
}
