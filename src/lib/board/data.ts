import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

/**
 * 소상공인 커뮤니티 게시판 (사용자 확정 사양).
 * 홈의 각 섹션 [더보기]가 도착하는 곳 — 부동산·정부지원/대출·공동구매·정보공유.
 * 네 화면이 목록+글쓰기라는 같은 골격이라 한 컬렉션(`boardPosts`)을 `kind` 로 나눈다.
 */

export const BOARD_KINDS = ['realty', 'support', 'groupbuy', 'share'] as const
export type BoardKind = (typeof BOARD_KINDS)[number]

export function isBoardKind(value: string): value is BoardKind {
  return (BOARD_KINDS as readonly string[]).includes(value)
}

export type BoardPost = {
  id: string
  kind: BoardKind
  title: string
  body: string
  /** 금액·기한처럼 한 줄로 보여줄 부가 정보 (예: `보증금 3,000 / 월 150`) */
  meta: string
  /** 원문·신청 링크. 정부지원은 출처가 없으면 신뢰할 수 없다. */
  sourceUrl: string
  imageURL: string | null
  authorName: string
  authorRole: string
  minutesAgo: number
}

function toPost(id: string, d: FirebaseFirestore.DocumentData, now: number): BoardPost {
  const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : now
  return {
    id,
    kind: (d.kind as BoardKind) ?? 'share',
    title: (d.title as string) ?? '',
    body: (d.body as string) ?? '',
    meta: (d.meta as string) ?? '',
    sourceUrl: (d.sourceUrl as string) ?? '',
    imageURL: (d.imageURL as string | null) ?? null,
    authorName: (d.authorName as string) ?? '',
    authorRole: (d.authorRole as string) ?? '',
    minutesAgo: Math.max(0, Math.floor((now - created) / 60_000)),
  }
}

/** 종류별 목록 — 최신순. 어드민이 숨긴 글은 빠진다. */
export async function listBoardPosts(kind: BoardKind, limit = 30): Promise<BoardPost[]> {
  const snap = await getAdminDb().collection('boardPosts').where('kind', '==', kind).limit(60).get()
  const now = Date.now()
  return snap.docs
    .filter((doc) => doc.data().status !== 'hidden')
    .map((doc) => toPost(doc.id, doc.data(), now))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, limit)
}

/** 홈 섹션 미리보기용 — 종류별 상위 n건. */
export async function listBoardPreview(kind: BoardKind, limit = 3): Promise<BoardPost[]> {
  return (await listBoardPosts(kind, limit)).slice(0, limit)
}
