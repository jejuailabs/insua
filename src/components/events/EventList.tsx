'use client'

import { CalendarRange, Globe2, Store, TicketPercent } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { issueEventCoupon } from '@/lib/events/actions'
import type { LocalEvent } from '@/lib/events/data'
import { cn } from '@/lib/utils/cn'

/**
 * 이벤트 목록 (사용자 확정 사양).
 * 매장이 붙어 있으면 매장 칩을, 없으면 '지역 전체' 배지를 단다 — 둘은 성격이 다른 이벤트다.
 * 할인율이 있으면 쿠폰을 받을 수 있고, 매장이 여럿이면 어디서 쓸지 골라 받는다.
 */
export function EventList({ events, signedIn }: { events: LocalEvent[]; signedIn: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const [target, setTarget] = useState<LocalEvent | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function openCoupon(event: LocalEvent) {
    if (!signedIn) return showToast(t('consumer.loginToCoupon'))
    setCode(null)
    setStoreId(event.stores[0]?.id ?? null)
    setTarget(event)
  }

  function claim() {
    if (!target || pending) return
    startTransition(async () => {
      const result = await issueEventCoupon(target.id, storeId)
      if (result.ok && result.value) setCode(result.value)
      else showToast(t('common.error'))
    })
  }

  const period = (event: LocalEvent) => {
    const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale)
    if (event.startsAt && event.endsAt) return `${fmt(event.startsAt)} – ${fmt(event.endsAt)}`
    if (event.endsAt) return `~ ${fmt(event.endsAt)}`
    if (event.startsAt) return `${fmt(event.startsAt)} ~`
    return null
  }

  return (
    <>
      <ul className="mt-4 flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id} className="overflow-hidden rounded-card border border-line bg-surface">
            {event.imageURL && (
              <div className="relative aspect-[2/1]">
                <Image
                  src={event.imageURL}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 560px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-subtitle text-content">{event.title}</h2>
                {/* 광역이면 매장 칩 대신 이 배지 하나 — 무엇에 걸린 이벤트인지가 한눈에 보여야 한다 */}
                {event.stores.length === 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-pill bg-accent-soft px-2 py-1 text-micro text-accent-strong">
                    <Globe2 size={11} aria-hidden />
                    {t('events.wide')}
                  </span>
                )}
              </div>

              {period(event) && (
                <p className="tabular mt-1 flex items-center gap-1.5 text-caption text-content-muted">
                  <CalendarRange size={13} aria-hidden />
                  {period(event)}
                </p>
              )}

              {event.body && (
                <p className="mt-2 text-body whitespace-pre-line text-content">{event.body}</p>
              )}

              {event.stores.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {event.stores.map((store) => (
                    <li key={store.id}>
                      <Link
                        href={`/${locale}/s/${store.id}`}
                        className="flex items-center gap-1 rounded-pill border border-line px-2.5 py-1 text-micro text-content-muted"
                      >
                        <Store size={11} aria-hidden />
                        {store.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {event.discountRate > 0 && (
                <button
                  type="button"
                  onClick={() => openCoupon(event)}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on"
                >
                  <TicketPercent size={16} aria-hidden />
                  {t('events.getCoupon', { rate: event.discountRate })}
                </button>
              )}

              <p className="mt-2 text-micro text-content-faint">{event.authorName}</p>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={t('consumer.couponTitle')}
        description={target ? `${target.title} · ${target.discountRate}%` : undefined}
      >
        {code ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <p className="text-caption text-content-muted">{t('consumer.couponIssued')}</p>
            <p className="tabular rounded-chip bg-accent-soft px-6 py-3 text-title text-accent-strong">
              {code}
            </p>
            <p className="text-micro text-content-faint">{t('consumer.couponCode')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 연계 매장이 여럿이면 어디서 쓸지 먼저 고른다 */}
            {target && target.stores.length > 1 && (
              <div className="flex flex-col gap-1">
                <span className="text-caption text-content-muted">{t('events.pickStore')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {target.stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setStoreId(store.id)}
                      aria-pressed={storeId === store.id}
                      className={cn(
                        'rounded-pill border px-3 py-1.5 text-label',
                        storeId === store.id
                          ? 'border-accent bg-accent-soft text-accent-strong'
                          : 'border-line text-content-muted',
                      )}
                    >
                      {store.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={claim}
              disabled={pending}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
            >
              <TicketPercent size={18} aria-hidden />
              {t('consumer.couponGet')}
            </button>
          </div>
        )}
      </Modal>

      {toast && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
