import { ChevronRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/**
 * 섹션 제목 + 부제 + `더보기 ›` (ref-01·02·04 공통 패턴).
 * `href` 는 필수다 — 누를 수 있게 생겼는데 아무 데도 안 가는 더보기를 만들지 않는다.
 */
export async function SectionHeader({
  title,
  sub,
  href,
}: {
  title: string
  sub?: string
  href: string
}) {
  const t = await getTranslations('common')

  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-subtitle text-content">{title}</h2>
        {sub && <p className="mt-0.5 text-caption text-content-muted">{sub}</p>}
      </div>
      <Link
        href={href}
        className="mt-1 flex min-h-8 shrink-0 items-center gap-0.5 rounded-chip px-2 text-caption text-content-muted hover:bg-surface-2"
      >
        {t('more')}
        <ChevronRight size={14} aria-hidden />
      </Link>
    </div>
  )
}
