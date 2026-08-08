import type { LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils/cn'

export type RailItem = {
  icon: LucideIcon
  labelKey: string
  href: string
  active?: boolean
  /** 이번 스코프 밖 화면. 링크 대신 비활성 표시만 한다. */
  stub?: boolean
}

/**
 * 좌측 세로 레일 (docs/06 §2 · docs/08 §3).
 * 폭 64px, 1024px↑ 200px 확장 + 라벨 우측 배치.
 * 활성: --accent-soft 배경 + --accent 아이콘·라벨 + 좌측 3px 인디케이터.
 */
export async function SideRail({ items, brand }: { items: RailItem[]; brand?: React.ReactNode }) {
  const t = await getTranslations()

  return (
    <nav className="sticky top-0 flex h-dvh w-16 shrink-0 flex-col border-r border-line bg-surface lg:w-50">
      {brand && <div className="px-3 py-4">{brand}</div>}

      <ul className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => {
          const Icon = item.icon
          const inner = (
            <span
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-inner px-1 py-2.5',
                'lg:flex-row lg:gap-3 lg:px-3',
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
              <span className="text-micro lg:text-label">{t(item.labelKey)}</span>
            </span>
          )
          return (
            <li key={item.labelKey}>
              {item.stub ? (
                <span aria-disabled title={t('common.comingSoon')}>
                  {inner}
                </span>
              ) : (
                <Link href={item.href}>{inner}</Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
