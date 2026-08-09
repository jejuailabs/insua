'use client'

import { ImageIcon, Mic, Send, Type, MessageSquareText, X, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'

export type DraftPost = { text: string; imageUrl?: string; file?: File | null; anonymous: boolean }

/**
 * 하단 컴포저 (ref-01, docs/07 B-5·B-6).
 * 텍스트 / 사진 / 음성 / 익명방 4모드. 익명이면 테두리가 muted 로 바뀌고
 * "익명으로 작성 중" 배지 + 전송 직전 확인 다이얼로그. 음성은 준비 중 토스트.
 */
export function Composer({ onPost }: { onPost: (draft: DraftPost) => void }) {
  const t = useTranslations()
  const [open, setOpen] = useState(true)
  const [text, setText] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function submit() {
    if (!text.trim() && !imageUrl) return
    onPost({ text: text.trim(), imageUrl: imageUrl ?? undefined, file: imageFile, anonymous })
    setText('')
    setImageUrl(null)
    setImageFile(null)
    setAnonymous(false)
    setConfirmOpen(false)
    showToast(t('merchant.posted'))
  }

  function handleSend() {
    if (!text.trim() && !imageUrl) return
    // 실수로 익명 글이 실명 게시되는 것보다, 익명 게시 직전 확인이 낫다 (docs/07 B-6).
    if (anonymous) setConfirmOpen(true)
    else submit()
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setImageUrl(URL.createObjectURL(file))
    setImageFile(file)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.write')}
        className="fixed right-4 bottom-4 z-40 grid h-13 w-13 place-items-center rounded-pill bg-accent-strong text-accent-on shadow-card"
      >
        <Pencil size={22} aria-hidden />
      </button>
    )
  }

  function focusText() {
    setAnonymous(false)
    inputRef.current?.focus()
  }
  function openPhotoPicker() {
    fileRef.current?.click()
  }

  const toolClass = (active: boolean) =>
    cn(
      'flex min-w-14 flex-col items-center gap-1 rounded-inner px-2 py-1.5',
      active ? 'text-accent-strong' : 'text-content-muted',
    )

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="pointer-events-auto w-full max-w-md border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-card lg:max-w-3xl lg:border-x">
          <div className="mx-auto max-w-md px-4 pt-3 pb-2">
            {anonymous && (
              <p className="mb-2 inline-block rounded-chip bg-surface-2 px-2 py-1 text-micro text-content-muted">
                {t('merchant.anonWriting')}
              </p>
            )}

            {imageUrl && (
              <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-inner border border-line">
                {/* 로컬 blob 미리보기라 next/image 최적화 대상이 아니다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  aria-label={t('common.delete')}
                  className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-pill bg-black/60 text-white"
                >
                  <X size={12} aria-hidden />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend()
                }}
                placeholder={t('merchant.composerHint')}
                className={cn(
                  'min-h-11 flex-1 rounded-chip border bg-bg px-4 text-body text-content outline-none',
                  anonymous ? 'border-line-strong' : 'border-line focus:border-accent',
                )}
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label={t('nav.write')}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on transition-opacity disabled:opacity-50"
                disabled={!text.trim() && !imageUrl}
              >
                <Send size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-2 flex items-start justify-around">
              <button type="button" onClick={focusText} className={toolClass(!anonymous)}>
                <Type size={18} aria-hidden />
                <span className="text-micro">{t('merchant.composer.text')}</span>
              </button>
              <button
                type="button"
                onClick={openPhotoPicker}
                className={toolClass(Boolean(imageUrl))}
              >
                <ImageIcon size={18} aria-hidden />
                <span className="text-micro">{t('merchant.composer.photo')}</span>
              </button>
              <button
                type="button"
                onClick={() => showToast(t('common.comingSoon'))}
                className={toolClass(false)}
              >
                <Mic size={18} aria-hidden />
                <span className="text-micro">{t('merchant.composer.voice')}</span>
              </button>
              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                className={toolClass(anonymous)}
              >
                <MessageSquareText size={18} aria-hidden />
                <span className="text-micro">{t('merchant.composer.anonymous')}</span>
              </button>
            </div>

            <div className="mt-1 flex justify-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="grid h-9 w-9 place-items-center rounded-pill bg-content text-surface"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('merchant.anonConfirm')}
        description={t('anonymous.notice')}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="min-h-11 flex-1 rounded-chip border border-line text-label text-content"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            className="min-h-11 flex-1 rounded-chip bg-accent-strong text-label text-accent-on"
          >
            {t('merchant.postAnon')}
          </button>
        </div>
      </Modal>

      {toast && (
        <p
          role="status"
          className="fixed bottom-40 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
