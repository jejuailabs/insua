import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import type { Tier } from '@/lib/crm/types'

/**
 * 등급 배지 (docs/04 §5.3). 배경 = 등급색, 글자 = 등급별 -on 색으로 대비를 맞춘다.
 * 표기는 글자 하나(S/A/B/C)만 — "A등급"처럼 길면 좁은 화면에서 세로로 꺾여 흉해진다
 * (사용자 지적). 전체 명칭은 스크린리더용 aria-label 로만 남긴다.
 */
const TIER_CLASS: Record<Tier, string> = {
  S: 'bg-tier-s text-tier-s-on',
  A: 'bg-tier-a text-tier-a-on',
  B: 'bg-tier-b text-tier-b-on',
  C: 'bg-tier-c text-tier-c-on',
}

export function TierBadge({ tier }: { tier: Tier }) {
  const t = useTranslations('tier')
  return (
    <span
      aria-label={t(tier)}
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-pill text-micro font-bold',
        TIER_CLASS[tier],
      )}
    >
      {tier}
    </span>
  )
}
