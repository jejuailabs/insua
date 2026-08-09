import { ChevronLeft, ChevronRight, Dog, Hand, ImageIcon, Mail, Music, Shirt } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { requireRolePage } from '@/lib/auth/guards'
import { Link } from '@/lib/i18n/navigation'

/** AI Tools 허브 (사용자 확정 사양) — 도구 메뉴 버튼. 주제가는 준비 중. */
export default async function AiToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['merchant', 'agent'])

  const t = await getTranslations()

  const tools = [
    {
      id: 'menu-poster',
      icon: ImageIcon,
      title: t('aiTools.menuPoster'),
      desc: t('aiTools.menuPosterDesc'),
    },
    { id: 'fitting', icon: Shirt, title: t('aiTools.fitting'), desc: t('aiTools.fittingDesc') },
    { id: 'nail', icon: Hand, title: t('aiTools.nail'), desc: t('aiTools.nailDesc') },
    { id: 'pet', icon: Dog, title: t('aiTools.pet'), desc: t('aiTools.petDesc') },
    {
      id: 'postcard',
      icon: Mail,
      title: t('aiTools.postcard'),
      desc: t('aiTools.postcardDesc'),
    },
  ]

  return (
    <main className="mx-auto max-w-md px-4 pt-2 pb-10 lg:max-w-3xl">
      <AdminPeekBanner />
      <header className="relative flex min-h-11 items-center">
        <Link
          href="/home"
          aria-label={t('nav.home')}
          className="grid h-10 w-10 place-items-center text-content"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-subtitle text-content">
          {t('aiTools.section')}
        </h1>
      </header>

      <ul className="mt-4 flex flex-col gap-3">
        {tools.map(({ id, icon: Icon, title, desc }) => (
          <li key={id}>
            <Link
              href={`/ai-tools/${id}`}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:border-accent"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-accent-soft text-accent-strong">
                <Icon size={22} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-subtitle text-content">{title}</span>
                <span className="mt-0.5 block truncate text-caption text-content-muted">
                  {desc}
                </span>
              </span>
              <ChevronRight size={18} aria-hidden className="shrink-0 text-content-muted" />
            </Link>
          </li>
        ))}

        {/* 주제가 만들기 — 음원 모델 미확정, 준비 중 (docs/10) */}
        <li className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 opacity-50">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-surface-2 text-content-muted">
            <Music size={22} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-subtitle text-content">{t('aiTools.themeSong')}</span>
            <span className="mt-0.5 block text-caption text-content-muted">
              {t('common.comingSoon')}
            </span>
          </span>
        </li>
      </ul>
    </main>
  )
}
