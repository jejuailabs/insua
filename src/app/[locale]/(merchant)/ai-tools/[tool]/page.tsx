import { ChevronLeft } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { AiToolScreen } from '@/components/ai/AiToolScreen'
import { AI_TOOLS, listAiJobs, listMenuTemplates, type AiToolId } from '@/lib/ai/tools'
import { requireRolePage } from '@/lib/auth/guards'
import { Link } from '@/lib/i18n/navigation'

// AI 생성이 도는 라우트 — 함수 시간을 60초로
export const maxDuration = 60

/** AI Tools 개별 도구 화면 (사용자 확정 사양). */
export default async function AiToolPage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>
}) {
  const { locale, tool } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['merchant', 'agent'])

  if (!AI_TOOLS.includes(tool as AiToolId)) notFound()
  const toolId = tool as AiToolId

  const [templates, history] = await Promise.all([
    toolId === 'menu-poster' ? listMenuTemplates() : Promise.resolve([]),
    listAiJobs(session.uid, toolId),
  ])

  const t = await getTranslations('aiTools')
  const titles: Record<AiToolId, string> = {
    'menu-poster': t('menuPoster'),
    fitting: t('fitting'),
    nail: t('nail'),
    pet: t('pet'),
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-2 pb-10">
      <AdminPeekBanner />
      <header className="relative flex min-h-11 items-center">
        <Link
          href="/ai-tools"
          aria-label={t('section')}
          className="grid h-10 w-10 place-items-center text-content"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-subtitle text-content">
          {titles[toolId]}
        </h1>
      </header>

      <div className="mt-3">
        <AiToolScreen
          tool={toolId}
          templates={templates}
          history={history}
          isAdmin={session.isAdmin}
        />
      </div>
    </main>
  )
}
