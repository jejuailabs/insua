'use client'

import { ImageIcon, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createEvent } from '@/lib/events/actions'
import type { EventStore } from '@/lib/events/data'
import { compressImage } from '@/lib/utils/compressImage'
import { cn } from '@/lib/utils/cn'

/**
 * 이벤트 등록 (사용자 확정 사양) — 설계사·관리자.
 * 매장 연계는 토글이다. 켜면 매장을 1개 이상 고르고, 끄면 광역 이벤트가 된다.
 * 무엇이 만들어지는지 토글 아래 한 줄로 계속 알려준다 — 저장하고 나서 알면 늦다.
 */
export function EventComposer({ stores }: { stores: EventStore[] }) {
  const t = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [linked, setLinked] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleStore(id: string) {
    setPicked((ids) => (ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]))
  }

  function submit() {
    const form = formRef.current
    if (!form || pending) return
    if (linked && picked.length === 0) return setError(t('events.pickAtLeastOne'))
    setError(null)
    startTransition(async () => {
      const data = new FormData(form)
      data.set('storeIds', picked.join(','))
      const photo = data.get('photo')
      if (photo instanceof File && photo.size > 0) data.set('photo', await compressImage(photo))
      const result = await createEvent(data)
      if (!result.ok) return setError(t('common.error'))
      form.reset()
      setPicked([])
      setLinked(false)
      setPreview(null)
      setOpen(false)
      router.refresh()
    })
  }

  const field =
    'min-h-11 w-full rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-chip bg-accent-strong px-4 text-label text-accent-on"
      >
        <Plus size={16} aria-hidden />
        {t('events.create')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('events.create')}
        description={t('events.createHint')}
      >
        <form
          ref={formRef}
          className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto pr-1"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid aspect-[2/1] place-items-center overflow-hidden rounded-inner border border-line bg-surface-2"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-content-faint">
                <ImageIcon size={22} aria-hidden />
                <span className="text-micro">{t('board.photo')}</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />

          <input name="title" placeholder={t('events.titlePlaceholder')} className={field} />
          <textarea
            name="body"
            rows={3}
            placeholder={t('events.bodyPlaceholder')}
            className={cn(field, 'min-h-20 py-3')}
          />

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-caption text-content-muted">{t('events.startsAt')}</span>
              <input type="date" name="startsAt" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-content-muted">{t('events.endsAt')}</span>
              <input type="date" name="endsAt" className={field} />
            </label>
          </div>

          <input
            name="discountRate"
            inputMode="numeric"
            placeholder={t('events.discountPlaceholder')}
            className={field}
          />

          {/* 매장 연계 토글 — 이벤트의 성격을 가르는 스위치 */}
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-chip border border-line px-4">
            <span className="text-body text-content">{t('events.linkStores')}</span>
            <input
              type="checkbox"
              name="linkStores"
              checked={linked}
              onChange={(e) => {
                setLinked(e.target.checked)
                if (!e.target.checked) setPicked([])
              }}
              className="h-5 w-5 accent-[var(--accent-strong)]"
            />
          </label>

          <p className="text-caption text-content-muted">
            {linked ? t('events.linkedHint', { n: picked.length }) : t('events.wideHint')}
          </p>

          {linked && (
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-inner border border-line p-2">
              {stores.length === 0 ? (
                <p className="p-3 text-center text-caption text-content-muted">
                  {t('events.noStores')}
                </p>
              ) : (
                stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    aria-pressed={picked.includes(store.id)}
                    className={cn(
                      'flex min-h-10 items-center justify-between rounded-chip px-3 text-label',
                      picked.includes(store.id)
                        ? 'bg-accent-soft text-accent-strong'
                        : 'text-content-muted hover:bg-surface-2',
                    )}
                  >
                    {store.name}
                    {picked.includes(store.id) && <span aria-hidden>✓</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-caption text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
          >
            {pending ? '…' : t('events.submit')}
          </button>
        </form>
      </Modal>
    </>
  )
}
