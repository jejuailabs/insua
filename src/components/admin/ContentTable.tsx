'use client'

import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { adminModerateContent, type ContentKind } from '@/lib/admin/actions'
import type { AdminContent, AdminContentRow } from '@/lib/admin/data'
import { cn } from '@/lib/utils/cn'

/**
 * 콘텐츠 관리 (사용자 확정 사양) — 올라온 상품·게시물·후기·익명글·매장을
 * 어드민이 숨기거나 지운다. 판정은 서버 액션의 requireAdmin — 여기 버튼은 표현일 뿐이다.
 * 삭제는 되돌릴 수 없으므로 한 번 더 확인받는다.
 */

const KINDS: Array<{ id: keyof AdminContent; kind: ContentKind; labelKey: string }> = [
  { id: 'products', kind: 'product', labelKey: 'admin.contentProducts' },
  { id: 'posts', kind: 'post', labelKey: 'admin.contentPosts' },
  { id: 'reviews', kind: 'review', labelKey: 'admin.contentReviews' },
  { id: 'anonymous', kind: 'anonymous', labelKey: 'admin.contentAnonymous' },
  { id: 'stores', kind: 'store', labelKey: 'admin.contentStores' },
  { id: 'board', kind: 'board', labelKey: 'admin.contentBoard' },
  { id: 'events', kind: 'event', labelKey: 'admin.contentEvents' },
]

export function ContentTable({ content }: { content: AdminContent }) {
  const t = useTranslations()
  const [tab, setTab] = useState<keyof AdminContent>('products')
  const [confirmRow, setConfirmRow] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const active = KINDS.find((k) => k.id === tab)!
  const rows = content[tab]

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function run(row: AdminContentRow, act: 'hide' | 'restore' | 'delete') {
    setBusy(row.id)
    setConfirmRow(null)
    startTransition(async () => {
      const result = await adminModerateContent(active.kind, row.id, act)
      setBusy(null)
      showToast(result.ok ? t(`admin.moderated.${act}`) : t('common.error'))
    })
  }

  return (
    <>
      {/* 종류 탭 */}
      <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {KINDS.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              'shrink-0 rounded-pill border px-3 py-1.5 text-label',
              tab === id
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-line text-content-muted',
            )}
          >
            {t(labelKey)}
            <span className="tabular ml-1.5 text-micro text-content-faint">
              {content[id].length}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
          {t('admin.contentEmpty')}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                'flex items-center gap-3 rounded-inner border border-line bg-surface p-3',
                row.status === 'hidden' && 'opacity-60',
              )}
            >
              {row.imageURL ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-inner">
                  <Image src={row.imageURL} alt="" fill sizes="48px" className="object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-inner bg-surface-2" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-label text-content">{row.title}</p>
                <p className="truncate text-micro text-content-muted">
                  {row.detail}
                  {row.status === 'hidden' && ` · ${t('admin.statusHidden')}`}
                </p>
              </div>

              {confirmRow === row.id ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => run(row, 'delete')}
                    className="rounded-chip bg-danger px-2.5 py-1.5 text-micro text-white"
                  >
                    {t('admin.confirmDelete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRow(null)}
                    className="rounded-chip border border-line px-2.5 py-1.5 text-micro text-content-muted"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => run(row, row.status === 'hidden' ? 'restore' : 'hide')}
                    aria-label={row.status === 'hidden' ? t('admin.restore') : t('admin.hide')}
                    className="grid h-9 w-9 place-items-center rounded-chip border border-line text-content-muted disabled:opacity-40"
                  >
                    {row.status === 'hidden' ? (
                      <Eye size={15} aria-hidden />
                    ) : (
                      <EyeOff size={15} aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => setConfirmRow(row.id)}
                    aria-label={t('admin.delete')}
                    className="grid h-9 w-9 place-items-center rounded-chip border border-line text-danger disabled:opacity-40"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <p
          role="status"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
