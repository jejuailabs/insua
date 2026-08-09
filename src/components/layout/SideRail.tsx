'use client'

import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LocalHeroLogo } from '@/components/brand/LocalHeroLogo'
import { agentRail } from '@/components/crm/agentRail'
import { consumerRail, type ConsumerSection } from '@/components/home/consumerRail'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

export type RailItem = {
  icon: LucideIcon
  labelKey: string
  href: string
  active?: boolean
  /** 이번 스코프 밖 화면. 링크 대신 비활성 표시만 한다. */
  stub?: boolean
}

type Props =
  | { variant: 'agent'; active: 'crm' | 'interactions' | 'schedule' | 'stats' }
  | { variant: 'consumer'; active: ConsumerSection; homeHref: '/' | '/feed' }

/**
 * 좌측 메뉴 (docs/06 §2 · docs/08 §3).
 * **PC(lg↑)**: 세로 레일 상시 노출. **모바일**: 좌하단 햄버거 → 드로어 (사용자 확정 사양).
 * 아이콘 함수는 직렬화가 안 되므로 rail 정의를 이 클라이언트 컴포넌트가 직접 만든다.
 */
export function SideRail(props: Props) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  const items: RailItem[] =
    props.variant === 'agent' ? agentRail(props.active) : consumerRail(props.active, props.homeHref)
  // 설계사 레일에는 소비자 홈이 없다 — 로고는 각 역할의 첫 화면으로 보낸다.
  const homeHref = props.variant === 'agent' ? '/crm' : props.homeHref

  const list = (onNavigate?: () => void) => (
    <ul className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const Icon = item.icon
        const inner = (
          <span
            className={cn(
              'relative flex items-center gap-3 rounded-inner px-3 py-2.5',
              item.active
                ? 'bg-accent-soft text-accent-strong'
                : 'text-content-muted hover:bg-surface-2',
              item.stub && 'opacity-50',
            )}
          >
            {item.active && (
              <span className="absolute top-1/2 left-0 h-6 w-0.75 -translate-y-1/2 rounded-pill bg-accent" />
            )}
            <Icon size={22} aria-hidden />
            <span className="text-label">{t(item.labelKey)}</span>
          </span>
        )
        return (
          <li key={item.labelKey}>
            {item.stub ? (
              <span aria-disabled title={t('common.comingSoon')}>
                {inner}
              </span>
            ) : (
              <Link href={item.href} onClick={onNavigate}>
                {inner}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* PC — 세로 레일 상시. 최상단에 로고 전체(심볼+워드마크)를 놓는다. */}
      <nav className="sticky top-0 hidden h-dvh w-50 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <Link href={homeHref} className="block px-5 pt-5 pb-4">
          <LocalHeroLogo layout="stacked" />
        </Link>
        {list()}
      </nav>

      {/* 모바일 — 좌하단 햄버거 + 드로어 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.menu')}
        className="fixed bottom-4 left-4 z-40 grid h-12 w-12 place-items-center rounded-pill border border-line bg-surface text-content shadow-card lg:hidden"
      >
        <Menu size={22} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <nav className="absolute top-0 bottom-0 left-0 flex w-64 flex-col bg-surface shadow-card">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href={homeHref} onClick={() => setOpen(false)}>
                <LocalHeroLogo markSize={34} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="grid h-9 w-9 place-items-center rounded-pill text-content-muted"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            {list(() => setOpen(false))}
          </nav>
        </div>
      )}
    </>
  )
}
