import { LocalHeroLogo } from '@/components/brand/LocalHeroLogo'
import { Bell } from 'lucide-react'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { setRequestLocale } from 'next-intl/server'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { SettingsButton } from '@/components/layout/SettingsButton'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { getMyConsumerProfile } from '@/lib/consumer/actions'
import { listFeedPosts } from '@/lib/feed/data'
import { listRandomProducts } from '@/lib/market/data'
import { listHeroes } from '@/lib/stores/data'

/** 소비자 LOCAL HERO 피드 (docs/08, ref-04) — 로그인 소비자 홈. */
export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  const [profile, heroes, feedPosts, products] = await Promise.all([
    getMyConsumerProfile(),
    listHeroes(20), // 메인 캐러셀 최대 20장 (사용자 확정 사양)
    listFeedPosts(12),
    listRandomProducts(6),
  ])

  return (
    <div className="flex">
      <SideRail variant="consumer" active="home" homeHref="/feed" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10 lg:max-w-4xl">
        <AdminPeekBanner />
        <header className="flex items-start justify-between">
          <h1>
            <LocalHeroLogo />
          </h1>
          <div className="flex items-center gap-1">
            <SettingsButton />
            <span className="grid h-10 w-10 place-items-center text-content-muted">
              <Bell size={20} aria-hidden />
            </span>
          </div>
        </header>

        <div className="mt-4">
          <FeedShowcase
            heroes={heroes}
            products={products}
            signedIn
            initialSavedIds={profile?.savedStoreIds ?? []}
          />
        </div>

        <FeedGrid initialPosts={feedPosts} />
      </main>
    </div>
  )
}
