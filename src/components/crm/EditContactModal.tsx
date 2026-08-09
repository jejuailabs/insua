'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { deleteContact, updateContact } from '@/lib/crm/actions'
import { TIERS, type Contact } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

/**
 * 고객카드 수정·삭제 (사용자 확정 사양).
 * 삭제는 되돌릴 수 없고 상담로그까지 함께 지우므로 확인을 한 번 더 받는다.
 * 이 고객으로 만든 공개 랜딩이 있으면 서버가 함께 비공개 처리한다.
 */
export function EditContactModal({
  contact,
  open,
  onClose,
}: {
  contact: Contact | null
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!contact) return null

  function save() {
    const form = formRef.current
    if (!form || !contact || pending) return
    setError(false)
    startTransition(async () => {
      const data = new FormData(form)
      data.set('contactId', contact.id)
      const result = await updateContact(data)
      if (!result.ok) return setError(true)
      onClose()
      router.refresh()
    })
  }

  function remove() {
    if (!contact || pending) return
    startTransition(async () => {
      const result = await deleteContact(contact.id)
      if (!result.ok) return setError(true)
      setConfirmDelete(false)
      onClose()
      router.refresh()
    })
  }

  const field =
    'min-h-11 w-full rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent'
  const label = 'text-caption text-content-muted'

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirmDelete(false)
        onClose()
      }}
      title={t('crm.editContact')}
      description={contact.name}
    >
      <form
        ref={formRef}
        className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <label className="flex flex-col gap-1">
          <span className={label}>{t('crm.form.name')}</span>
          <input name="name" defaultValue={contact.name} className={field} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className={label}>{t('crm.form.company')}</span>
            <input name="company" defaultValue={contact.company} className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>{t('crm.form.position')}</span>
            <input name="position" defaultValue={contact.position} className={field} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className={label}>{t('crm.form.phone')}</span>
            <input name="phone" inputMode="tel" defaultValue={contact.phone} className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>{t('crm.form.tier')}</span>
            <select name="tier" defaultValue={contact.tier} className={field}>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {t(`tier.${tier}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={label}>{t('crm.form.storeAddress')}</span>
          <input name="address" defaultValue={contact.address} className={field} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={label}>{t('crm.note')}</span>
          <textarea
            name="note"
            rows={3}
            defaultValue={contact.note}
            className={cn(field, 'min-h-20 py-3')}
          />
        </label>

        <fieldset className="flex flex-col gap-2 rounded-inner border border-line p-3">
          <legend className="px-1 text-caption text-content-muted">{t('crm.form.consent')}</legend>
          {(
            [
              ['consentShare', 'consentShare', contact.consent.dataSharing],
              ['consentPortrait', 'consentPortrait', contact.consent.portrait],
              ['consentRecording', 'consentRecording', contact.consent.recording],
            ] as const
          ).map(([name, key, checked]) => (
            <label key={name} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked}
                className="h-5 w-5 accent-[var(--accent)]"
              />
              <span className="text-body text-content">{t(`crm.form.${key}`)}</span>
            </label>
          ))}
        </fieldset>

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
          {pending ? '…' : t('common.save')}
        </button>

        {/* 삭제 — 상담로그까지 지워지고 되돌릴 수 없다 */}
        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-inner border border-danger p-3">
            <p className="text-caption text-content">{t('crm.deleteWarning')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="min-h-11 flex-1 rounded-chip bg-danger text-label text-white disabled:opacity-60"
              >
                {t('crm.deleteConfirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-11 flex-1 rounded-chip border border-line text-label text-content-muted"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-chip border border-line text-label text-danger"
          >
            <Trash2 size={15} aria-hidden />
            {t('crm.deleteContact')}
          </button>
        )}
      </form>
    </Modal>
  )
}
