'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createContact } from '@/lib/crm/actions'
import { TIER_CYCLE_DAYS, TIERS, type Tier } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

/**
 * 신규 고객 등록 폼 (docs/06 §6).
 * 최소 필수는 이름 하나 — 입력 장벽을 낮추는 게 제품 원칙이다.
 * 동의 3종은 기본 해제. 미리 체크해두지 않는다.
 */
export function NewContactForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('crm.form')
  const tTier = useTranslations('tier')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [tier, setTier] = useState<Tier>('B')
  const [note, setNote] = useState('')
  const [consentShare, setConsentShare] = useState(false)
  const [consentPortrait, setConsentPortrait] = useState(false)
  const [consentRecording, setConsentRecording] = useState(false)
  const [error, setError] = useState(false)

  function submit() {
    if (!name.trim() || pending) return
    setError(false)
    startTransition(async () => {
      const result = await createContact({
        name,
        company,
        position,
        phone,
        tier,
        note,
        consent: {
          dataSharing: consentShare,
          portrait: consentPortrait,
          recording: consentRecording,
        },
      })
      if (!result.ok) {
        setError(true)
        return
      }
      setName('')
      setCompany('')
      setPosition('')
      setPhone('')
      setTier('B')
      setNote('')
      setConsentShare(false)
      setConsentPortrait(false)
      setConsentRecording(false)
      onClose()
      router.refresh()
    })
  }

  const field =
    'min-h-11 w-full rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent'

  return (
    <Modal open={open} onClose={onClose} title={t('title')}>
      <div className="flex max-h-[60dvh] flex-col gap-3 overflow-y-auto pr-1">
        <label className="flex flex-col gap-1">
          <span className="text-label text-content">{t('name')} *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label text-content-muted">{t('company')}</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-label text-content-muted">{t('position')}</span>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label text-content-muted">{t('phone')}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className={field}
            />
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-label text-content-muted">{t('tier')}</span>
          <div className="flex gap-2">
            {TIERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTier(value)}
                className={cn(
                  'min-h-10 flex-1 rounded-chip border text-label',
                  tier === value
                    ? 'border-accent bg-accent-soft text-accent-strong'
                    : 'border-line text-content-muted',
                )}
              >
                {tTier(value)}
              </button>
            ))}
          </div>
          <p className="text-micro text-content-faint">
            {t('cycle')} — {t('cycleDefault', { n: TIER_CYCLE_DAYS[tier] })}
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-label text-content-muted">{t('note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={field} />
        </label>

        <fieldset className="mt-1 flex flex-col gap-2 border-t border-line pt-3">
          <legend className="sr-only">{t('consentTitle')}</legend>
          <p className="text-label text-content">{t('consentTitle')}</p>
          {(
            [
              [consentShare, setConsentShare, t('consentShare')],
              [consentPortrait, setConsentPortrait, t('consentPortrait')],
              [consentRecording, setConsentRecording, t('consentRecording')],
            ] as const
          ).map(([checked, set, label]) => (
            <label key={label} className="flex items-center gap-2 text-caption text-content">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => set(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </fieldset>

        {error && (
          <p role="alert" className="text-caption text-danger">
            {t('failed')}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || pending}
          className="min-h-12 rounded-chip bg-accent-strong text-label text-accent-on transition-opacity disabled:opacity-50"
        >
          {pending ? t('saving') : t('submit')}
        </button>
      </div>
    </Modal>
  )
}
