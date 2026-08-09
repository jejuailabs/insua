'use client'

import { ImageIcon, ImagePlus, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createFeedPost } from '@/lib/feed/actions'
import { compressImage } from '@/lib/utils/compressImage'

/** 피드 글쓰기 (설계사 화면용) — 사진+글 → 메인 실시간 피드로. */
export function FeedPostButton({ authorName }: { authorName?: string }) {
  const t = useTranslations('feed')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  function submit() {
    if ((!body.trim() && !photo) || pending) return
    startTransition(async () => {
      const form = new FormData()
      form.set('body', body)
      if (photo) form.set('photo', await compressImage(photo))
      if (authorName) form.set('authorName', authorName)
      const result = await createFeedPost(form)
      if (result.ok) {
        setBody('')
        setPhoto(null)
        setPreview(null)
        setOpen(false)
        setToast(t('posted'))
        setTimeout(() => setToast(null), 2000)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('write')}
        className="grid h-10 w-10 place-items-center rounded-pill text-content-muted hover:bg-surface-2"
      >
        <ImagePlus size={20} aria-hidden />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('write')}
        description={t('writeHint')}
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid aspect-[2/1] place-items-center overflow-hidden rounded-inner border border-line bg-surface-2"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={22} aria-hidden className="text-content-faint" />
            )}
          </button>
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

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('placeholder')}
            rows={3}
            className="w-full rounded-chip border border-line bg-bg px-4 py-3 text-body text-content outline-none focus:border-accent"
          />

          <button
            type="button"
            onClick={submit}
            disabled={(!body.trim() && !photo) || pending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-50"
          >
            <Send size={16} aria-hidden />
            {pending ? '…' : t('post')}
          </button>
        </div>
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
