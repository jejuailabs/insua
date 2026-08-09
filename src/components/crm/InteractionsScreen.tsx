'use client'

import { ImageIcon, Mic, Pencil, Phone, Send, Sparkles, Square, Footprints } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { TierBadge } from '@/components/ui/TierBadge'
import { addInteraction, addMediaInteraction, transcribeInteraction } from '@/lib/crm/actions'
import { compressImage } from '@/lib/utils/compressImage'
import type { Contact, Interaction, InteractionType } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

const TYPE_ICON = { note: Pencil, call: Phone, visit: Footprints, voice: Mic } as const

/**
 * 상담로그 (docs/06 §7). 좌측 고객 목록(축소) + 우측 타임라인. 모바일은 단일 컬럼.
 * AI 요약은 docs/10 어댑터 — 버튼만 두고 준비 중 (실호출 없음).
 */
export function InteractionsScreen({
  contacts,
  selectedId,
  interactions,
}: {
  contacts: Contact[]
  selectedId: string | null
  interactions: Interaction[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [type, setType] = useState<InteractionType>('note')
  const [toast, setToast] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = contacts.find((c) => c.id === selectedId) ?? null

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  function submit() {
    if (!selected || !body.trim() || pending) return
    startTransition(async () => {
      const result = await addInteraction(selected.id, type, body)
      if (result.ok) {
        setBody('')
        showToast(t('crm.logSaved'))
        router.refresh()
      }
    })
  }

  /** 녹음 시작/종료 (사용자 확정 사양) — 종료 시 Storage 저장, 정리는 별도 버튼. */
  async function toggleRecording() {
    if (!selected) return
    if (!selected.consent.recording) return showToast(t('crm.recordNeedsConsent'))

    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const form = new FormData()
        form.set('contactId', selected.id)
        form.set('kind', 'voice')
        form.set('body', body.trim())
        form.set('file', new File([blob], 'recording.webm', { type: blob.type }))
        startTransition(async () => {
          const result = await addMediaInteraction(form)
          if (result.ok) {
            setBody('')
            showToast(t('crm.logSaved'))
            router.refresh()
          }
        })
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      showToast(t('crm.recordNeedsConsent'))
    }
  }

  function attachPhoto(file: File | undefined) {
    if (!file || !selected) return
    startTransition(async () => {
      const form = new FormData()
      form.set('contactId', selected.id)
      form.set('kind', 'image')
      form.set('body', body.trim())
      form.set('file', await compressImage(file))
      const result = await addMediaInteraction(form)
      if (result.ok) {
        setBody('')
        showToast(t('crm.logSaved'))
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* 고객 목록 (축소형) */}
      <ul className="flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto md:w-44 md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {contacts.map((contact) => (
          <li key={contact.id} className="shrink-0">
            <button
              type="button"
              onClick={() => router.replace(`/${locale}/interactions?contactId=${contact.id}`)}
              className={cn(
                'flex w-full items-center gap-2 rounded-inner border p-2 text-left',
                contact.id === selectedId
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface',
              )}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-pill bg-surface-2">
                {contact.photoURL && (
                  <Image src={contact.photoURL} alt="" fill sizes="36px" className="object-cover" />
                )}
              </span>
              <span className="hidden min-w-0 flex-col md:flex">
                <span className="truncate text-label text-content">{contact.name}</span>
                <span className="truncate text-micro text-content-muted">{contact.company}</span>
              </span>
              <span className="text-label text-content md:hidden">{contact.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 타임라인 */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-subtitle text-content">{selected.name}</h2>
              <TierBadge tier={selected.tier} />
              <button
                type="button"
                onClick={() => showToast(t('common.comingSoon'))}
                className="ml-auto flex items-center gap-1 rounded-chip border border-line px-3 py-1.5 text-label text-content-muted"
              >
                <Sparkles size={14} aria-hidden />
                {t('crm.aiSummary')}
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-2 pb-36">
              {interactions.map((item) => {
                const Icon = TYPE_ICON[item.type]
                return (
                  <li key={item.id} className="rounded-inner border border-line bg-surface p-3">
                    <p className="flex items-center gap-1.5 text-micro text-content-muted">
                      <Icon size={12} aria-hidden />
                      {t(`crm.type${item.type[0]!.toUpperCase()}${item.type.slice(1)}`)}
                      <span className="tabular ml-auto">
                        {new Date(item.createdAt).toLocaleDateString(locale)}
                      </span>
                    </p>
                    {item.body && <p className="mt-1.5 text-body text-content">{item.body}</p>}

                    {item.imageUrl && (
                      <div className="relative mt-2 aspect-[2/1] overflow-hidden rounded-inner">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="480px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {item.audioUrl && (
                      <div className="mt-2 flex flex-col gap-2">
                        <audio controls src={item.audioUrl} className="w-full" />
                        {item.transcript ? (
                          <div className="rounded-inner bg-surface-2 p-3">
                            <p className="flex items-center gap-1 text-micro text-accent-strong">
                              <Sparkles size={11} aria-hidden />
                              {t('crm.transcriptTitle')} · {t('crm.aiBadge')}
                            </p>
                            <p className="mt-1.5 text-caption whitespace-pre-line text-content">
                              {item.transcript}
                            </p>
                          </div>
                        ) : (
                          <TranscribeButton contactId={selected.id} interactionId={item.id} />
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
              {interactions.length === 0 && (
                <li className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
                  {t('crm.logEmpty')}
                </li>
              )}
            </ul>

            {/* 컴포저 */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto max-w-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  {(['note', 'call', 'visit', 'voice'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={cn(
                        'rounded-chip border px-3 py-1.5 text-micro',
                        type === value
                          ? 'border-accent bg-accent-soft text-accent-strong'
                          : 'border-line text-content-muted',
                      )}
                    >
                      {t(`crm.type${value[0]!.toUpperCase()}${value.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit()
                    }}
                    placeholder={recording ? t('crm.recording') : t('crm.logPlaceholder')}
                    className={cn(
                      'min-h-11 min-w-0 flex-1 rounded-chip border bg-bg px-4 text-body text-content outline-none',
                      recording ? 'border-danger' : 'border-line focus:border-accent',
                    )}
                  />
                  {/* 녹음 — recording 동의 고객만. 녹음 중엔 정지 아이콘 */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    aria-label={t('crm.record')}
                    aria-pressed={recording}
                    disabled={pending}
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-pill border',
                      recording
                        ? 'animate-pulse border-danger bg-danger text-white'
                        : selected.consent.recording
                          ? 'border-line text-content'
                          : 'border-line text-content-faint',
                    )}
                  >
                    {recording ? <Square size={16} aria-hidden /> : <Mic size={18} aria-hidden />}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={t('crm.attachPhoto')}
                    disabled={pending || recording}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-pill border border-line text-content disabled:opacity-50"
                  >
                    <ImageIcon size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!body.trim() || pending || recording}
                    aria-label={t('common.save')}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on disabled:opacity-50"
                  >
                    <Send size={18} aria-hidden />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => attachPhoto(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
            {t('crm.logEmpty')}
          </p>
        )}
      </div>

      {toast && (
        <p
          role="status"
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </div>
  )
}

/** 녹음 → STT + 날짜·장소·타임라인 구조화 (사용자 확정 사양). */
function TranscribeButton({
  contactId,
  interactionId,
}: {
  contactId: string
  interactionId: string
}) {
  const t = useTranslations('crm')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setFailed(false)
        startTransition(async () => {
          const result = await transcribeInteraction(contactId, interactionId)
          if (result.ok) router.refresh()
          else setFailed(true)
        })
      }}
      className="flex min-h-10 items-center justify-center gap-1.5 rounded-chip bg-accent-soft text-label text-accent-strong disabled:opacity-60"
    >
      <Sparkles size={14} aria-hidden />
      {pending ? t('transcribing') : failed ? t('heroCardFailed') : t('transcribe')}
    </button>
  )
}
