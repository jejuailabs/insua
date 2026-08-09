'use client'

import { ExternalLink, ImageIcon, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createBoardPost } from '@/lib/board/actions'
import type { BoardKind, BoardPost } from '@/lib/board/data'
import { compressImage } from '@/lib/utils/compressImage'
import { cn } from '@/lib/utils/cn'

/**
 * 커뮤니티 게시판 화면 (사용자 확정 사양) — 홈 [더보기]의 목적지.
 * 목록 + 글쓰기가 네 종류(부동산·정부지원/대출·공동구매·정보공유) 모두 같은 골격이다.
 * 종류마다 다른 건 부가정보 칸의 안내 문구뿐이라, 화면을 넷으로 복사하지 않는다.
 */
export function BoardScreen({
  kind,
  posts,
  canWrite,
}: {
  kind: BoardKind
  posts: BoardPost[]
  canWrite: boolean
}) {
  const t = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit() {
    const form = formRef.current
    if (!form || pending) return
    setError(false)
    startTransition(async () => {
      const data = new FormData(form)
      data.set('kind', kind)
      const photo = data.get('photo')
      if (photo instanceof File && photo.size > 0) data.set('photo', await compressImage(photo))
      const result = await createBoardPost(data)
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
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-caption text-content-muted">{t(`board.${kind}.desc`)}</p>
        {canWrite && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-chip bg-accent-strong px-4 text-label text-accent-on"
          >
            <Plus size={16} aria-hidden />
            {t('board.write')}
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="mt-4 rounded-card border border-line bg-surface p-10 text-center text-body text-content-muted">
          {t('board.empty')}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex gap-3 overflow-hidden rounded-card border border-line bg-surface p-3"
            >
              {post.imageURL && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-inner">
                  <Image src={post.imageURL} alt="" fill sizes="80px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-subtitle text-content">
                    {post.title}
                  </span>
                  <span className="tabular shrink-0 text-micro text-content-faint">
                    {post.minutesAgo >= 60
                      ? t('common.hoursAgo', { n: Math.floor(post.minutesAgo / 60) })
                      : t('common.minutesAgo', { n: post.minutesAgo })}
                  </span>
                </p>
                {post.meta && (
                  <p className="tabular mt-0.5 text-label text-accent-strong">{post.meta}</p>
                )}
                {post.body && (
                  <p className="mt-1 line-clamp-3 text-caption whitespace-pre-line text-content-muted">
                    {post.body}
                  </p>
                )}
                <p className="mt-1.5 flex items-center gap-2 text-micro text-content-faint">
                  <span>{post.authorName}</span>
                  {post.sourceUrl && (
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-accent-strong"
                    >
                      <ExternalLink size={11} aria-hidden />
                      {t('board.source')}
                    </a>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('board.write')}
        description={t(`board.${kind}.title`)}
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

          <input name="title" placeholder={t('board.titlePlaceholder')} className={field} />
          <input name="meta" placeholder={t(`board.${kind}.metaPlaceholder`)} className={field} />
          <input name="sourceUrl" placeholder={t('board.sourcePlaceholder')} className={field} />
          <textarea
            name="body"
            rows={4}
            placeholder={t('board.bodyPlaceholder')}
            className={cn(field, 'min-h-24 py-3')}
          />

          {error && (
            <p role="alert" className="text-caption text-danger">
              {t('common.error')}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-chip bg-accent-strong text-label text-accent-on disabled:opacity-60"
          >
            {pending ? '…' : t('board.submit')}
          </button>
        </form>
      </Modal>
    </>
  )
}
