import { Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import type { Hero, Perk } from '@/lib/mock/home'

/**
 * 메인 히어로 레일 (docs/08, ref-04).
 * 가로 스냅 스크롤 — 캐러셀 JS 없이 CSS 로만 굴린다. 서버 컴포넌트로 남길 수 있다.
 */
export async function HeroRail({ heroes }: { heroes: Hero[] }) {
  const t = await getTranslations()

  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {heroes.map((hero, index) => (
        <li
          key={hero.id}
          className="relative aspect-[3/4] w-[78%] max-w-sm shrink-0 snap-center overflow-hidden rounded-card border border-line"
        >
          <Image
            src={hero.image}
            alt=""
            fill
            sizes="(max-width: 768px) 78vw, 384px"
            className="object-cover"
            priority={index === 0}
          />

          {/* 사진 위 텍스트 대비를 확보한다. 색 리터럴 대신 검정 알파만 쓴다 (docs/04 §2). */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

          <span className="tabular absolute top-3 left-3 rounded-chip bg-black/50 px-2 py-1 text-micro text-white">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="absolute top-3 right-3 rounded-pill bg-black/50 px-3 py-1 text-micro text-white">
            {t(`consumer.category.${hero.category}`)}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-title text-white">{hero.name}</p>
            <p className="mt-0.5 text-caption text-white/80">{hero.tagline}</p>

            <p className="mt-2 flex items-center gap-1 text-label text-white">
              <Star size={14} className="fill-current text-warning" aria-hidden />
              <span className="tabular">
                {t('format.rating', { rating: hero.rating, count: hero.reviews })}
              </span>
            </p>

            <ul className="mt-3 flex gap-1.5">
              {hero.perks.map((perk) => (
                <PerkChip key={perkKey(perk)} perk={perk} />
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  )
}

function perkKey(perk: Perk): string {
  return perk.kind === 'hours' ? `hours-${perk.open}` : `${perk.kind}-${perkValue(perk)}`
}

function perkValue(perk: Perk): string {
  switch (perk.kind) {
    case 'discount':
      return `${perk.rate}%`
    case 'hours':
      return `${perk.open}–${perk.close}`
    default:
      return perk.value
  }
}

async function PerkChip({ perk }: { perk: Perk }) {
  const t = await getTranslations('consumer')
  const label =
    perk.kind === 'discount'
      ? t('discountShort')
      : perk.kind === 'hours'
        ? t('hours')
        : perk.kind === 'signature'
          ? t('signature')
          : t('gift')

  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-chip bg-black/45 px-2 py-2 text-center">
      <span className="w-full truncate text-label text-white">{perkValue(perk)}</span>
      <span className="w-full truncate text-micro text-white/70">{label}</span>
    </li>
  )
}
