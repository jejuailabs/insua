import { CircleUser, Gift, Home, ShoppingBag, User } from 'lucide-react'
import type { RailItem } from '@/components/layout/SideRail'

export type ConsumerSection = 'home' | 'heroes' | 'market' | 'events' | 'me'

/**
 * 소비자 좌측 레일 (docs/08 §3, ref-04).
 * 공개 화면(랜딩·히어로·마켓·이벤트)에서는 홈이 `/`, 로그인 소비자 화면에서는 `/feed`.
 */
export function consumerRail(active: ConsumerSection, homeHref: '/' | '/feed'): RailItem[] {
  return [
    { icon: Home, labelKey: 'nav.feed', href: homeHref, active: active === 'home' },
    { icon: User, labelKey: 'nav.heroes', href: '/heroes', active: active === 'heroes' },
    { icon: ShoppingBag, labelKey: 'nav.market', href: '/market', active: active === 'market' },
    { icon: Gift, labelKey: 'nav.events', href: '/events', active: active === 'events' },
    { icon: CircleUser, labelKey: 'nav.myPage', href: '/me', active: active === 'me' },
  ]
}
