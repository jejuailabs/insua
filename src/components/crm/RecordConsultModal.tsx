'use client'

import { Mic, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { addMediaInteraction, transcribeInteraction } from '@/lib/crm/actions'
import type { Contact } from '@/lib/crm/types'
import { cn } from '@/lib/utils/cn'

/**
 * 상담 녹음 (사용자 확정 사양) — CRM 헤더에서 바로 녹음한다.
 *
 * 순서가 중요하다: **파일을 먼저 저장하고 그다음 STT**.
 * 정리(STT)가 실패해도 녹음 원본은 남아야 하기 때문이다 — 상담 내용은 다시 못 만든다.
 * 마이크는 브라우저 권한만 있으면 되고, 녹음 대상은 동의한 고객으로 한정된다.
 */
export function RecordConsultModal({
  open,
  onClose,
  contacts,
}: {
  open: boolean
  onClose: () => void
  contacts: Contact[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const [targetId, setTargetId] = useState(contacts[0]?.id ?? '')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const target = contacts.find((c) => c.id === targetId) ?? null

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function toggle() {
    if (!target) return
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      stopTimer()
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
        form.set('contactId', target.id)
        form.set('kind', 'voice')
        form.set('file', new File([blob], 'recording.webm', { type: blob.type }))
        startTransition(async () => {
          setStatus(t('crm.saving'))
          const saved = await addMediaInteraction(form)
          if (!saved.ok) return setStatus(t('common.error'))
          router.refresh()
          if (!saved.id) return setStatus(t('crm.logSaved'))
          setStatus(t('crm.transcribing'))
          const stt = await transcribeInteraction(target.id, saved.id)
          setStatus(stt.ok ? t('crm.transcriptDone') : t('crm.transcriptFailed'))
          router.refresh()
        })
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setSeconds(0)
      setStatus(null)
      timerRef.current = setInterval(() => setSeconds((n) => n + 1), 1000)
    } catch {
      // 권한 거부·마이크 없음 — 무엇이 문제인지 알려준다
      setStatus(t('crm.micDenied'))
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <Modal
      open={open}
      onClose={() => {
        if (recording) {
          recorderRef.current?.stop()
          setRecording(false)
          stopTimer()
        }
        onClose()
      }}
      title={t('crm.recordConsult')}
      description={t('crm.recordHint')}
    >
      {contacts.length === 0 ? (
        <p className="py-6 text-center text-body text-content-muted">
          {t('crm.recordNeedsConsent')}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-caption text-content-muted">{t('crm.recordTarget')}</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={recording}
              className="min-h-11 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` · ${c.company}` : ''}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className={cn(
              'flex min-h-14 items-center justify-center gap-2 rounded-chip text-label disabled:opacity-60',
              recording ? 'bg-danger text-white' : 'bg-accent-strong text-accent-on',
            )}
          >
            {recording ? <Square size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
            {recording ? `${t('crm.recording')} ${mm}:${ss}` : t('crm.recordStart')}
          </button>

          {status && (
            <p role="status" className="text-center text-caption text-content-muted">
              {status}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
