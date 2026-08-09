'use client'

import { Bot, Send, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { askCrmAssistant } from '@/lib/crm/actions'
import { cn } from '@/lib/utils/cn'

type Message = { role: 'user' | 'assistant'; text: string }

/**
 * 설계사 CRM 비서 (사용자 확정 사양) — 설계사가 등록한 모든 데이터(고객·상담로그)를
 * 근거로 자연어 질의응답. 서버 액션이 본인 데이터만 컨텍스트로 주입한다.
 */
export function CrmAssistant() {
  const t = useTranslations('crm')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()
  const listRef = useRef<HTMLDivElement>(null)

  function send() {
    const q = input.trim()
    if (!q || pending) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    startTransition(async () => {
      const result = await askCrmAssistant(q)
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: result.ok ? result.answer : t('heroCardFailed') },
      ])
      setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('assistant')}
        className="fixed right-4 bottom-4 z-40 grid h-13 w-13 place-items-center rounded-pill bg-accent-strong text-accent-on shadow-card"
      >
        {open ? <X size={22} aria-hidden /> : <Bot size={24} aria-hidden />}
      </button>

      {open && (
        <div className="fixed right-4 bottom-20 z-40 flex max-h-[65dvh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <p className="flex items-center gap-2 border-b border-line px-4 py-3 text-subtitle text-content">
            <Bot size={18} aria-hidden className="text-accent-strong" />
            {t('assistant')}
          </p>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="p-3 text-caption text-content-muted">{t('assistantHint')}</p>
            )}
            <ul className="flex flex-col gap-2">
              {messages.map((message, i) => (
                <li
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-inner px-3 py-2 text-caption whitespace-pre-line',
                    message.role === 'user'
                      ? 'self-end bg-accent-strong text-accent-on'
                      : 'self-start bg-surface-2 text-content',
                  )}
                >
                  {message.text}
                </li>
              ))}
              {pending && (
                <li className="self-start rounded-inner bg-surface-2 px-3 py-2 text-caption text-content-muted">
                  …
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-2 border-t border-line p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
              placeholder={t('assistantPlaceholder')}
              className="min-h-10 min-w-0 flex-1 rounded-chip border border-line bg-bg px-3 text-caption text-content outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || pending}
              aria-label={t('assistant')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent-strong text-accent-on disabled:opacity-50"
            >
              <Send size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
