import { setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { StoreScreen } from '@/components/store/StoreScreen'
import { requireRolePage } from '@/lib/auth/guards'
import { listMyFeedPosts } from '@/lib/feed/data'
import { listStoresForOwner } from '@/lib/stores/data'

/** 내 매장 — 업주 편집 화면 (ref-01, docs/07 B). 공개 화면은 /s/[storeId]. */
export default async function StorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['merchant'])
  const [stores, myPosts] = await Promise.all([
    listStoresForOwner(session.uid),
    listMyFeedPosts(session.uid),
  ])

  return (
    <>
      <AdminPeekBanner />
      <StoreScreen
        // 등급은 설계사의 내부 평가다 — 업주 화면으로 값 자체를 내려보내지 않는다
        stores={stores.map((store) => ({ ...store, tier: undefined }))}
        news={myPosts.map((post) => ({
          id: post.id,
          text: post.body,
          imageUrl: post.imageURL,
          minutesAgo: post.minutesAgo,
        }))}
      />
    </>
  )
}
