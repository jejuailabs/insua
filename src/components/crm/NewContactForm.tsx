'use client'

import { ImageIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createContactWithCard } from '@/lib/crm/actions'
import { compressImage } from '@/lib/utils/compressImage'
import { TIER_CYCLE_DAYS, TIERS, type Tier } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

const CATEGORIES = ['restaurant', 'cafe', 'bakery', 'salon', 'farm', 'retail', 'etc'] as const

/**
 * 신규 고객 등록 폼 v2 (docs/06 §6 + 히어로 카드 파이프라인).
 * 최소 필수는 이름 하나. 동의 3종 기본 해제.
 * 사진 + 매장 정보 + 정보 공유 동의가 갖춰지면 등록과 동시에
 * AI 히어로 카드·랜딩페이지가 생성된다 (미동의면 나중에 버튼 하나로).
 */
export function NewContactForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('crm.form')
  const tTier = useTranslations('tier')
  const tCat = useTranslations('consumer.category')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  const [tier, setTier] = useState<Tier>('B')
  const [consentShare, setConsentShare] = useState(false)
  const [error, setError] = useState(false)
  const [ownerPreview, setOwnerPreview] = useState<string | null>(null)
  const [menuPreview, setMenuPreview] = useState<string | null>(null)
  const [done, setDone] = useState<'card' | 'plain' | null>(null)

  function submit() {
    const form = formRef.current
    if (!form || pending) return
    const data = new FormData(form)
    if (!String(data.get('name') ?? '').trim()) return
    data.set('tier', tier)
    setError(false)

    startTransition(async () => {
      // Vercel 요청 한도(4.5MB) 안으로 — 업로드 전 압축 (docs/07 B-5)
      for (const key of ['ownerPhoto', 'menuPhoto'] as const) {
        const file = data.get(key)
        if (file instanceof File && file.size > 0) data.set(key, await compressImage(file))
        else data.delete(key)
      }
      const result = await createContactWithCard(data)
      if (!result.ok) {
        setError(true)
        return
      }
      setDone(result.storeId ? 'card' : 'plain')
      form.reset()
      setOwnerPreview(null)
      setMenuPreview(null)
      setTier('B')
      setConsentShare(false)
      router.refresh()
      setTimeout(() => {
        setDone(null)
        onClose()
      }, 1600)
    })
  }

  const field =
    'min-h-11 w-full rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent'
  const label = 'text-label text-content-muted'

  return (
    <Modal open={open} onClose={onClose} title={t('title')}>
      <form
        ref={formRef}
        className="flex max-h-[62dvh] flex-col gap-3 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-label text-content">{t('name')} *</span>
          <input name="name" className={field} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className={label}>{t('phone')}</span>
            <input name="phone" inputMode="tel" className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>{t('position')}</span>
            <input name="position" className={field} />
          </label>
        </div>

        {/* 사진 2종 — 히어로 카드의 AI 입력 재료 */}
        <div className="grid grid-cols-2 gap-2">
          <PhotoPicker
            name="ownerPhoto"
            label={t('ownerPhoto')}
            preview={ownerPreview}
            onPick={setOwnerPreview}
          />
          <PhotoPicker
            name="menuPhoto"
            label={t('menuPhoto')}
            preview={menuPreview}
            onPick={setMenuPreview}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className={label}>{t('tier')}</span>
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
          <span className={label}>{t('note')}</span>
          <input name="note" className={field} />
        </label>

        {/* 매장 정보 — 카드·랜딩 자동생성 재료 */}
        <fieldset className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-label text-content">{t('storeSection')}</p>
          <p className="-mt-1 text-micro text-content-faint">{t('storeSectionHint')}</p>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={label}>{t('storeName')}</span>
              <input name="storeName" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t('storeCategory')}</span>
              <select name="storeCategory" className={field} defaultValue="restaurant">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tCat(c)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={label}>{t('storeTagline')}</span>
            <input name="storeTagline" className={field} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={label}>{t('menuName')}</span>
              <input name="menuName" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t('menuPrice')}</span>
              <input name="menuPrice" inputMode="numeric" className={field} />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={label}>{t('storeAddress')}</span>
            <input name="storeAddress" className={field} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={label}>{t('storeHours')}</span>
              <div className="flex items-center gap-1">
                <input name="storeOpen" placeholder="09:00" className={cn(field, 'min-w-0')} />
                <span className="text-content-muted">–</span>
                <input name="storeClose" placeholder="21:00" className={cn(field, 'min-w-0')} />
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t('sns')}</span>
              <input name="sns" placeholder="@instagram" className={field} />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-label text-content">{t('consentTitle')}</p>
          <label className="flex items-center gap-2 text-caption text-content">
            <input
              type="checkbox"
              name="consentShare"
              checked={consentShare}
              onChange={(e) => setConsentShare(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t('consentShare')}
          </label>
          <label className="flex items-center gap-2 text-caption text-content">
            <input
              type="checkbox"
              name="consentPortrait"
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t('consentPortrait')}
          </label>
          <label className="flex items-center gap-2 text-caption text-content">
            <input
              type="checkbox"
              name="consentRecording"
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t('consentRecording')}
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="text-caption text-danger">
            {t('failed')}
          </p>
        )}
        {done && (
          <p role="status" className="text-caption text-success">
            {done === 'card' ? t('generatedWithCard') : t('title')} ✓
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-chip bg-accent-strong text-label text-accent-on transition-opacity disabled:opacity-60"
        >
          {pending ? (consentShare ? t('generating') : t('saving')) : t('submit')}
        </button>
      </form>
    </Modal>
  )
}

function PhotoPicker({
  name,
  label,
  preview,
  onPick,
}: {
  name: string
  label: string
  preview: string | null
  onPick: (url: string | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label text-content-muted">{label}</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-inner border border-line bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={20} aria-hidden className="text-content-faint" />
        )}
      </button>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          onPick(file ? URL.createObjectURL(file) : null)
        }}
      />
    </label>
  )
}
