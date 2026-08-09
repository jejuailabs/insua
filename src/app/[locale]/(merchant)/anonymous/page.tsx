import { ChevronLeft, MessagesSquare } from 'lucide-react'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnonymousComposer } from '@/components/merchant/AnonymousComposer'
import { requireRolePage } from '@/lib/auth/guards'
import { Link } from '@/lib/i18n/navigation'
import { countRecentAuthors, listAnonymousPosts } from '@/lib/merchant/anonymous'

/** 익명방 "아프니까 사장이다" (docs/07 A-4) — Firestore 실데이터. */
export default async function AnonymousPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['merchant'])

  const [posts, liveCount] = await Promise.all([listAnonymousPosts(), countRecentAuthors()])
  const t = await getTranslations()

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-2 pb-28 lg:max-w-3xl">
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
            {t('anonymous.roomName')}
          </h1>
        </header>

        <p className="mt-2 text-caption text-content-muted">{t('anonymous.desc')}</p>
        <p className="mt-1 text-caption text-accent-strong">
          {t('anonymous.liveCount', { count: liveCount })}
        </p>
        {/* 상시 고지 (docs/07 A-4) */}
        <p className="mt-3 rounded-chip bg-surface-2 px-3 py-2 text-micro text-content-muted">
          {t('anonymous.notice')}
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {posts.map((post) => (
            <li key={post.id} className="rounded-card border border-line bg-surface p-3">
              <p className="text-body text-content">{post.title}</p>
              <p className="mt-1.5 flex items-center gap-2 text-micro text-content-muted">
                {t('anonymous.author')} ·{' '}
                {post.minutesAgo >= 60
                  ? t('common.hoursAgo', { n: Math.floor(post.minutesAgo / 60) })
                  : t('common.minutesAgo', { n: post.minutesAgo })}
                <span className="ml-auto flex items-center gap-1">
                  <MessagesSquare size={12} aria-hidden />
                  {post.comments}
                </span>
              </p>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
              {t('anonymous.empty')}
            </li>
          )}
        </ul>
      </main>

      <AnonymousComposer />
    </>
  )
}
