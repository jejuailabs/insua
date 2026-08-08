import { BarChart3, CalendarCheck, FileText, Home, Mail, Settings, Users } from 'lucide-react'
import type { RailItem } from '@/components/layout/SideRail'

/** 설계사 좌측 레일 (docs/06 §2). 홈·메시지·설정은 이번 스코프 밖 — stub. */
export function agentRail(active: 'crm' | 'interactions' | 'schedule' | 'stats'): RailItem[] {
  return [
    { icon: Home, labelKey: 'nav.home', href: '/crm', stub: true },
    { icon: Users, labelKey: 'nav.crm', href: '/crm', active: active === 'crm' },
    {
      icon: FileText,
      labelKey: 'nav.interactions',
      href: '/interactions',
      active: active === 'interactions',
    },
    {
      icon: CalendarCheck,
      labelKey: 'nav.schedule',
      href: '/schedule',
      active: active === 'schedule',
    },
    { icon: Mail, labelKey: 'nav.messages', href: '/crm', stub: true },
    { icon: BarChart3, labelKey: 'nav.stats', href: '/stats', active: active === 'stats' },
    { icon: Settings, labelKey: 'nav.settings', href: '/crm', stub: true },
  ]
}
