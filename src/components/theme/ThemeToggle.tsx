'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import { useIsMounted } from '@/lib/utils/useIsMounted'

const OPTIONS = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
] as const

/**
 * 세그먼트 컨트롤 3칸 (docs/04 §6.3).
 * on/off 스위치를 쓰지 않는 이유: "시스템" 상태를 표현할 수 없다.
 */
export function ThemeToggle() {
  const t = useTranslations('theme')
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  // 마운트 전에는 아이콘을 그리지 않는다. 자리는 고정폭으로 잡아둬 레이아웃이 밀리지 않게 한다.
  if (!mounted) return <div className="h-9 w-28" aria-hidden />

  return (
    <div
      role="radiogroup"
      aria-label={t('toggleLabel')}
      className="inline-flex h-9 items-center gap-0.5 rounded-pill border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map(({ value, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setTheme(value)}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-pill transition-colors',
              active ? 'bg-accent text-accent-on' : 'text-content-muted hover:text-content',
            )}
          >
            <Icon size={16} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
