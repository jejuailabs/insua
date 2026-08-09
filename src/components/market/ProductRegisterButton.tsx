'use client'

import { ImageIcon, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createProduct } from '@/lib/market/actions'
import { cn } from '@/lib/utils/cn'

/** 상품 등록 (설계사·관리자 전용) — 사진·가격·텍스트 → 마켓 즉시 노출. */
export function ProductRegisterButton() {
  const t = useTranslations('market')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  function submit() {
    const form = formRef.current
    if (!form || pending) return
    setError(false)
    startTransition(async () => {
      const result = await createProduct(new FormData(form))
      if (!result.ok) {
        setError(true)
        return
      }
      form.reset()
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
        className="flex min-h-10 items-center gap-1.5 rounded-chip bg-accent-strong px-4 text-label text-accent-on"
      >
        <Plus size={16} aria-hidden />
        {t('register')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('register')}
        description={t('registerHint')}
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
                <span className="text-micro">{t('photo')}</span>
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

          <input name="name" placeholder={t('name')} className={field} />
          <div className="grid grid-cols-2 gap-2">
            <input name="price" inputMode="numeric" placeholder={t('price')} className={field} />
            <input name="phone" inputMode="tel" placeholder={t('inquiryCall')} className={field} />
          </div>
          <input name="sub" placeholder={t('desc')} className={field} />
          <textarea
            name="desc"
            placeholder={t('detail')}
            rows={3}
            className={cn(field, 'min-h-20 py-3')}
          />

          {error && (
            <p role="alert" className="text-caption text-danger">
              {t('registerHint')}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
          >
            {pending ? '…' : t('submit')}
          </button>
        </form>
      </Modal>
    </>
  )
}
