'use client'

import { UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { setMyAgent } from '@/lib/consumer/actions'

/**
 * 담당 설계사 지정 (docs/08 §9) — 수익구조와 연결되는 지점.
 * 지정이 무엇을 의미하는지(내 정보가 전달됨) 명확히 고지하고 동의를 받는다. 얼버무리지 않는다.
 */
export function AgentSection({ currentAgentId }: { currentAgentId: string | null }) {
  const t = useTranslations('consumer')
  const router = useRouter()
  const [code, setCode] = useState('')
  const [consented, setConsented] = useState(false)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function submit() {
    if (!code.trim() || !consented || pending) return
    startTransition(async () => {
      const result = await setMyAgent(code, consented)
      if (result.ok) {
        setDone(true)
        setCode('')
        setConsented(false)
        router.refresh()
      }
    })
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-subtitle text-content">
        <UserCheck size={18} aria-hidden className="text-accent-strong" />
        {t('agentSection')}
      </h2>
      <p className="mt-1 text-caption text-content-muted">{t('agentDesc')}</p>

      {currentAgentId && (
        <p className="mt-2 rounded-chip bg-accent-soft px-3 py-2 text-label text-accent-strong">
          {t('agentCurrent', { code: currentAgentId })}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('agentPlaceholder')}
          className="min-h-11 min-w-0 flex-1 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!code.trim() || !consented || pending}
          className="min-h-11 shrink-0 rounded-chip bg-accent-strong px-4 text-label text-accent-on disabled:opacity-50"
        >
          {done ? t('agentDone') : t('agentSet')}
        </button>
      </div>

      {/* 개인정보 고지 — 동의 없이는 버튼이 활성화되지 않는다 */}
      <label className="mt-2 flex items-start gap-2 text-caption text-content">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          {t('agentConsent')}
          <span className="mt-0.5 block text-micro text-content-muted">{t('agentNotice')}</span>
        </span>
      </label>
    </section>
  )
}
