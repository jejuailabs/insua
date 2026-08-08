import { ChevronRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/** 섹션 제목 + 부제 + `더보기 ›` (ref-01·02·04 공통 패턴). */
export async function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  const t = await getTranslations('common')

  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-subtitle text-content">{title}</h2>
        {sub && <p className="mt-0.5 text-caption text-content-muted">{sub}</p>}
      </div>
      <span className="mt-1 flex shrink-0 items-center gap-0.5 text-caption text-content-muted">
        {t('more')}
        <ChevronRight size={14} aria-hidden />
      </span>
    </div>
  )
}
