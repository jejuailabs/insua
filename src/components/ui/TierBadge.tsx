import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import type { Tier } from '@/lib/mock/crm'

/** 등급 배지 (docs/04 §5.3). 배경 = 등급색, 글자 = 등급별 -on 색으로 대비를 맞춘다. */
const TIER_CLASS: Record<Tier, string> = {
  S: 'bg-tier-s text-tier-s-on',
  A: 'bg-tier-a text-tier-a-on',
  B: 'bg-tier-b text-tier-b-on',
  C: 'bg-tier-c text-tier-c-on',
}

export function TierBadge({ tier }: { tier: Tier }) {
  const t = useTranslations('tier')
  return (
    <span className={cn('rounded-pill px-2 py-0.5 text-micro', TIER_CLASS[tier])}>{t(tier)}</span>
  )
}
