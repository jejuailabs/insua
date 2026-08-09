import { Bell, CircleUser, Menu, Home, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils/cn'

/**
 * 소상공인 하단 탭바 (docs/07 A-6).
 * 홈 / 알림 / 글쓰기(FAB) / 내정보 / 더보기. 중앙 FAB 는 8px 돌출.
 * 소상공인 공간은 모바일 전용 스테이지라 데스크톱에서도 폰 폭(max-w-md)으로 잘린다.
 * 내정보 → 내 매장. 나머지 대상 화면은 이번 스코프 밖이라 표시만 한다.
 */
export async function BottomTabBar() {
  const t = await getTranslations('nav')

  const side = 'flex flex-col items-center gap-1 text-content-muted'

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-md border-t border-line bg-surface lg:max-w-2xl',
          'pb-[env(safe-area-inset-bottom)] lg:border-x',
        )}
      >
        <div className="flex items-end justify-between px-8 pt-2 pb-2">
          <span className={cn(side, 'text-accent-strong')}>
            <Home size={22} aria-hidden />
            <span className="text-micro">{t('home')}</span>
          </span>
          <span className={side}>
            <Bell size={22} aria-hidden />
            <span className="text-micro">{t('notifications')}</span>
          </span>

          <Link href="/store" className="flex -translate-y-2 flex-col items-center gap-1">
            <span className="grid h-13 w-13 place-items-center rounded-pill bg-accent-strong text-accent-on shadow-card">
              <Plus size={26} aria-hidden />
            </span>
            <span className="text-micro text-content-muted">{t('write')}</span>
          </Link>

          <Link href="/store" className={side}>
            <CircleUser size={22} aria-hidden />
            <span className="text-micro">{t('myInfo')}</span>
          </Link>
          <span className={side}>
            <Menu size={22} aria-hidden />
            <span className="text-micro">{t('settings')}</span>
          </span>
        </div>
      </div>
    </nav>
  )
}
