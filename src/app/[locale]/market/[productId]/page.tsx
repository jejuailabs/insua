import { ChevronLeft, MessageCircle, Phone } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getProduct } from '@/lib/market/data'

export const revalidate = 300

/**
 * 상품 상세 — 쇼핑몰 구조 (사용자 확정 사양):
 * 큰 이미지 → 이름·가격 → 문의 액션 → 아래로 상세 설명.
 * 결제는 스코프 밖 — 전화·카카오 문의로 연결한다 (docs/08 §6).
 * 상세페이지 자동생성은 향후 과제로 남긴다.
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>
}) {
  const { locale, productId } = await params
  setRequestLocale(locale)

  const product = await getProduct(productId)
  if (!product) notFound()

  const t = await getTranslations()

  return (
    <main className="mx-auto max-w-md px-4 pt-2 pb-28">
      <header className="flex min-h-11 items-center">
        <Link
          href="/market"
          aria-label={t('nav.market')}
          className="grid h-10 w-10 place-items-center text-content"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
      </header>

      <div className="relative aspect-square overflow-hidden rounded-card border border-line">
        <Image
          src={product.image}
          alt=""
          fill
          sizes="(max-width: 768px) 92vw, 420px"
          className="object-cover"
          priority
        />
        {product.best && (
          <span className="absolute top-3 left-3 rounded-chip bg-accent-strong px-2 py-1 text-micro text-accent-on">
            BEST
          </span>
        )}
      </div>

      <h1 className="mt-4 text-title text-content">{product.name}</h1>
      {product.sub && <p className="mt-1 text-body text-content-muted">{product.sub}</p>}
      <p className="tabular mt-2 text-display text-content">
        {t('format.currency', { amount: product.price.toLocaleString() })}
      </p>

      {product.sellerName && (
        <p className="mt-2 text-caption text-content-muted">
          {t('market.soldBy')} · {product.sellerName}
        </p>
      )}

      {product.desc && (
        <section className="mt-6 border-t border-line pt-4">
          <h2 className="text-subtitle text-content">{t('market.detail')}</h2>
          <p className="mt-2 text-body whitespace-pre-line text-content">{product.desc}</p>
        </section>
      )}

      {/* 문의 액션 바 — 결제 없음 (docs/08 §6) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md gap-2 px-4 py-3">
          <a
            href={product.phone ? `tel:${product.phone}` : undefined}
            aria-disabled={!product.phone}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on aria-disabled:opacity-50"
          >
            <Phone size={16} aria-hidden />
            {t('market.inquiryCall')}
          </a>
          <a
            href="https://pf.kakao.com"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-chip border border-line text-label text-content"
          >
            <MessageCircle size={16} aria-hidden />
            {t('market.inquiryKakao')}
          </a>
        </div>
      </div>
    </main>
  )
}
