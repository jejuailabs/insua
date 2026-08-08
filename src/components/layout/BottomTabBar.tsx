import { Bell, CircleUser, Menu, Home, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils/cn'

/**
 * 소상공인 하단 탭바 (docs/07 A-6).
 * 홈 / 알림 / 글쓰기(FAB) / 내정보 / 더보기. 중앙 FAB 는 8px 돌출.
 * 라우팅 대상 화면(알림 등)은 이번 스코프 밖이라 표시만 한다.
 */
export async function BottomTabBar() {
  const t = await getTranslations('nav')

  const side = 'flex flex-col items-center gap-1 text-content-muted'

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <div className="mx-auto flex max-w-md items-end justify-between px-8 pt-2 pb-2">
        <span className={cn(side, 'text-accent-strong')}>
          <Home size={22} aria-hidden />
          <span className="text-micro">{t('home')}</span>
        </span>
        <span className={side}>
          <Bell size={22} aria-hidden />
          <span className="text-micro">{t('notifications')}</span>
        </span>

        <span className="flex -translate-y-2 flex-col items-center gap-1">
          <span className="grid h-13 w-13 place-items-center rounded-pill bg-accent-strong text-accent-on shadow-card">
            <Plus size={26} aria-hidden />
          </span>
          <span className="text-micro text-content-muted">{t('write')}</span>
        </span>

        <span className={side}>
          <CircleUser size={22} aria-hidden />
          <span className="text-micro">{t('myInfo')}</span>
        </span>
        <span className={side}>
          <Menu size={22} aria-hidden />
          <span className="text-micro">{t('settings')}</span>
        </span>
      </div>
    </nav>
  )
}
