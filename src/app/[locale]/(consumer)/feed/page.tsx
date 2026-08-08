import { Bell, CircleUser, Gift, Heart, Home, ShoppingBag, User } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { SideRail, type RailItem } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { HEROES } from '@/lib/mock/home'
import { cn } from '@/lib/utils/cn'

/** 소비자 LOCAL HERO 피드 (docs/08, ref-04). 목데이터 단계 — 반경 쿼리는 M6 후반. */
export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  const t = await getTranslations()

  const rail: RailItem[] = [
    { icon: Home, labelKey: 'nav.feed', href: '/feed', active: true },
    { icon: User, labelKey: 'nav.heroes', href: '/feed', stub: true },
    { icon: ShoppingBag, labelKey: 'nav.market', href: '/feed', stub: true },
    { icon: Gift, labelKey: 'nav.events', href: '/feed', stub: true },
    { icon: Heart, labelKey: 'nav.saved', href: '/feed', stub: true },
    { icon: CircleUser, labelKey: 'nav.myPage', href: '/feed', stub: true },
  ]

  return (
    <div className="flex">
      <SideRail items={rail} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
        <header className="flex items-start justify-between">
          <h1 className="text-display leading-[0.95] tracking-[-0.04em] text-accent-strong">
            LOCAL
            <br />
            HERO
          </h1>
          <span className="grid h-10 w-10 place-items-center text-content-muted">
            <Bell size={20} aria-hidden />
          </span>
        </header>

        {/* 반경 필터 (docs/08 §5) — 위치 권한은 칩을 누를 때 요청. 지금은 표시만 */}
        <div className="mt-3 flex gap-2">
          {[1, 3, 5].map((km) => (
            <span
              key={km}
              className={cn(
                'rounded-pill border px-3 py-1.5 text-label',
                km === 3
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-line text-content-muted',
              )}
            >
              {t('consumer.radius', { km })}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <FeedShowcase heroes={HEROES} />
        </div>
      </main>
    </div>
  )
}
