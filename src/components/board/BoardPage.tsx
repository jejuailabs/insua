import { ChevronLeft } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { BoardScreen } from '@/components/board/BoardScreen'
import { listBoardPosts, type BoardKind } from '@/lib/board/data'
import { requireRolePage } from '@/lib/auth/guards'
import { Link } from '@/lib/i18n/navigation'

/**
 * 게시판 페이지 공통 껍데기 (사용자 확정 사양).
 * 부동산·정부지원/대출·공동구매·정보공유가 같은 골격이라 네 라우트가 이걸 공유한다.
 */
export async function BoardPage({ kind, locale }: { kind: BoardKind; locale: string }) {
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['merchant'])
  const [posts, t] = await Promise.all([listBoardPosts(kind), getTranslations()])
  const canWrite =
    session.role === 'merchant' || session.role === 'agent' || session.isAdmin === true

  return (
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
          {t(`board.${kind}.title`)}
        </h1>
      </header>

      <BoardScreen kind={kind} posts={posts} canWrite={canWrite} />
    </main>
  )
}
