import { cn } from '@/lib/utils/cn'

/**
 * LOCAL HERO 브랜드 로고 (사용자 제공 원본을 벡터로 옮김).
 * 색은 `--brand-*` 토큰만 쓴다 — 팔레트를 바꿔도 로고는 그대로여야 아이덴티티가 산다.
 * 다크에서는 실루엣만 밝게 뒤집히고 망토 주황은 유지된다 (docs/04 §2.1 등급색과 같은 원리).
 */

/** 심볼만 — 헤더·파비콘·좁은 자리용. */
export function LocalHeroMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 124 124"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      {/* 망토 — 인물 뒤 */}
      <path
        d="M64 25 C86 24 105 37 119 51 C105 52 100 61 91 68 C85 73 79 76 72 75 C83 60 80 38 64 25 Z"
        fill="var(--brand-cape)"
      />
      <path
        d="M69 30 C83 45 84 61 76 75 C83 73 89 68 94 62 C89 50 80 37 69 30 Z"
        fill="var(--brand-cape-shade)"
      />
      {/* 머리 */}
      <circle cx="52" cy="14" r="13.5" fill="var(--brand-ink)" />
      {/* 몸 — 허리에 손 얹은 팔의 빈 공간을 evenodd 로 뚫는다 */}
      <path
        fill="var(--brand-ink)"
        fillRule="evenodd"
        d="M32 31 C23 36 18 46 19 55 C21 62 28 67 36 70 L33 98 L45 98 L52 74 L59 98 L71 98 L68 70 C76 67 83 62 85 55 C86 46 81 36 72 31 C67 28 58 27 52 27 C46 27 37 28 32 31 Z
           M36 37 C30 43 28 50 29 55 C32 60 36 63 40 65 L39 51 Z
           M68 37 C74 43 76 50 75 55 C72 60 68 63 64 65 L65 51 Z"
      />
      {/* 가슴 별 */}
      <path
        d="M52 38 L54.47 44.6 L61.51 44.91 L55.99 49.3 L57.88 56.09 L52 52.2 L46.12 56.09 L48.01 49.3 L42.49 44.91 L49.53 44.6 Z"
        fill="var(--brand-ink-on)"
      />
      {/* 지평선 */}
      <path d="M4 118 C34 100 90 97 122 110 C86 103 36 109 4 118 Z" fill="var(--brand-ink)" />
    </svg>
  )
}

/**
 * 로고 + 워드마크.
 * `stacked` = 심볼 위, 워드마크 아래 + 별 구분선 (레일 최상단 — 로고가 다 보이는 자리).
 * `inline`  = 심볼 옆 워드마크 (메인 헤더 등 가로로 좁은 자리).
 */
export function LocalHeroLogo({
  layout = 'inline',
  markSize,
  className,
}: {
  layout?: 'inline' | 'stacked'
  markSize?: number
  className?: string
}) {
  if (layout === 'stacked') {
    return (
      <span className={cn('flex flex-col items-center gap-1', className)}>
        <LocalHeroMark size={markSize ?? 56} />
        <span className="text-subtitle leading-none font-extrabold tracking-[-0.02em] text-[var(--brand-ink)]">
          LOCAL HERO
        </span>
        {/* 원본의 밑줄 + 별 구분 */}
        <span aria-hidden className="flex w-full items-center gap-1">
          <span className="h-px flex-1 bg-[var(--brand-ink)]" />
          <StarGlyph />
          <span className="h-px flex-1 bg-[var(--brand-ink)]" />
        </span>
      </span>
    )
  }

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LocalHeroMark size={markSize ?? 30} />
      <span className="text-title leading-none tracking-[-0.03em] text-[var(--brand-ink)]">
        LOCAL HERO
      </span>
    </span>
  )
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 20 20" width={9} height={9} aria-hidden className="shrink-0">
      <path
        d="M10 1 L12.47 7.6 L19.51 7.91 L13.99 12.3 L15.88 19.09 L10 15.2 L4.12 19.09 L6.01 12.3 L0.49 7.91 L7.53 7.6 Z"
        fill="var(--brand-cape)"
      />
    </svg>
  )
}
