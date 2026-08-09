'use client'

import { ImageIcon, Send, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { createReview } from '@/lib/reviews/actions'
import type { ReviewView } from '@/lib/reviews/data'
import { compressImage } from '@/lib/utils/compressImage'
import { cn } from '@/lib/utils/cn'

/**
 * 방문 후기 (사용자 확정 사양) — 랜딩페이지 하단.
 * 로그인 사용자는 사진+별점+텍스트로 작성, 비로그인은 로그인 유도(기능 특정 문구).
 */
export function ReviewSection({
  storeId,
  reviews,
  signedIn,
}: {
  storeId: string
  reviews: ReviewView[]
  signedIn: boolean
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  function submit() {
    if ((!body.trim() && !photo) || pending) return
    startTransition(async () => {
      const form = new FormData()
      form.set('storeId', storeId)
      form.set('body', body)
      form.set('rating', String(rating))
      if (photo) form.set('photo', await compressImage(photo))
      const result = await createReview(form)
      if (result.ok) {
        setBody('')
        setPhoto(null)
        setPreview(null)
        setRating(5)
        setToast(t('review.posted'))
        setTimeout(() => setToast(null), 2000)
        router.refresh()
      }
    })
  }

  return (
    <section className="mt-6">
      <h2 className="text-subtitle text-content">{t('review.section')}</h2>

      {/* 작성 */}
      {signedIn ? (
        <div className="mt-3 rounded-card border border-line bg-surface p-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${t('review.rating')} ${value}`}
                className="p-0.5"
              >
                <Star
                  size={18}
                  aria-hidden
                  className={cn(value <= rating ? 'fill-current text-warning' : 'text-line-strong')}
                />
              </button>
            ))}
          </div>

          {preview && (
            <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-inner border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              placeholder={t('review.placeholder')}
              className="min-h-11 min-w-0 flex-1 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t('review.photo')}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-pill border border-line text-content"
            >
              <ImageIcon size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={(!body.trim() && !photo) || pending}
              aria-label={t('review.submit')}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on disabled:opacity-50"
            >
              <Send size={18} aria-hidden />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setPhoto(file)
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />
        </div>
      ) : (
        <Link
          href={`/${locale}?login=1`}
          className="mt-3 block rounded-card border border-line bg-surface p-4 text-center text-caption text-content-muted"
        >
          {t('review.loginNeeded')}
        </Link>
      )}

      {/* 목록 */}
      {reviews.length === 0 ? (
        <p className="mt-3 text-caption text-content-muted">{t('review.empty')}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-card border border-line bg-surface p-3">
              <p className="flex items-center gap-2 text-label text-content">
                {review.authorName}
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={12}
                      aria-hidden
                      className={cn(
                        i < review.rating ? 'fill-current text-warning' : 'text-line-strong',
                      )}
                    />
                  ))}
                </span>
                <span className="tabular ml-auto text-micro text-content-muted">
                  {review.minutesAgo >= 60
                    ? t('common.hoursAgo', { n: Math.floor(review.minutesAgo / 60) })
                    : t('common.minutesAgo', { n: review.minutesAgo })}
                </span>
              </p>
              {review.photoURL && (
                <div className="relative mt-2 aspect-[2/1] overflow-hidden rounded-inner">
                  <Image
                    src={review.photoURL}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, 480px"
                    className="object-cover"
                  />
                </div>
              )}
              {review.body && <p className="mt-2 text-body text-content">{review.body}</p>}
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </section>
  )
}
