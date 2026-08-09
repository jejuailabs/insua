import { ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/auth/session'
import { Link } from '@/lib/i18n/navigation'

/**
 * 어드민이 역할 화면을 열람 중일 때 상시 표시되는 배너 (docs/09 §1).
 * 지금 권한이 다르다는 걸 항상 보여야 한다. 일반 사용자에게는 아무것도 그리지 않는다.
 */
export async function AdminPeekBanner() {
  const session = await getSession()
  if (!session?.isAdmin) return null

  const t = await getTranslations('admin')

  return (
    <div className="sticky top-0 z-50 -mx-4 flex items-center justify-between gap-2 bg-warning/20 px-4 py-2">
      <p className="flex items-center gap-1.5 text-caption text-content">
        <ShieldCheck size={14} aria-hidden />
        {t('banner')}
      </p>
      <Link
        href="/admin"
        className="shrink-0 rounded-chip bg-surface px-3 py-1 text-label text-content"
      >
        {t('backToConsole')}
      </Link>
    </div>
  )
}
