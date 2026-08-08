'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * 모달 (docs/04 §5).
 *
 * 네이티브 `<dialog>` 를 쓴다 — ESC 닫기, 포커스 트랩, 바깥 요소 inert 처리를
 * 브라우저가 해준다. 직접 구현하면 접근성이 조용히 깨진다.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const t = useTranslations('common')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      // ESC 는 dialog 가 직접 닫는다. 상태를 되돌려주지 않으면 다음 open 이 먹지 않는다.
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // 백드롭 클릭. dialog 자신이 타깃일 때만 — 내용 클릭은 통과시킨다.
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0',
        'text-content shadow-card backdrop:bg-black/50',
        'm-auto', // dialog 기본 마진을 덮어 화면 중앙에 세운다
      )}
      aria-labelledby="modal-title"
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-0">
        <div>
          <h2 id="modal-title" className="text-title text-content">
            {title}
          </h2>
          {description && <p className="mt-1 text-caption text-content-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="-mt-1 -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-chip text-content-muted hover:bg-surface-2"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="p-5">{children}</div>
    </dialog>
  )
}
