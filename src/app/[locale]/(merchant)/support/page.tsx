import { BoardPage } from '@/components/board/BoardPage'

/** support 게시판 — 홈 섹션 [더보기]의 목적지 (사용자 확정 사양). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <BoardPage kind="support" locale={locale} />
}
