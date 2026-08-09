import { Bell } from 'lucide-react'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { setRequestLocale } from 'next-intl/server'
import { consumerRail } from '@/components/home/consumerRail'
import { LiveFeed } from '@/components/feed/LiveFeed'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { RadiusChips } from '@/components/home/RadiusChips'
import { SettingsButton } from '@/components/layout/SettingsButton'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { getMyConsumerProfile } from '@/lib/consumer/actions'
import { listFeedPosts } from '@/lib/feed/data'
import { listHeroes } from '@/lib/stores/data'

/** 소비자 LOCAL HERO 피드 (docs/08, ref-04) — 로그인 소비자 홈. */
export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  const profile = await getMyConsumerProfile()
  const heroes = await listHeroes()
  const feedPosts = await listFeedPosts()

  return (
    <div className="flex">
      <SideRail items={consumerRail('home', '/feed')} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
        <AdminPeekBanner />
        <header className="flex items-start justify-between">
          <h1 className="text-display leading-[0.95] tracking-[-0.04em] text-accent-strong">
            LOCAL
            <br />
            HERO
          </h1>
          <div className="flex items-center gap-1">
            <SettingsButton />
            <span className="grid h-10 w-10 place-items-center text-content-muted">
              <Bell size={20} aria-hidden />
            </span>
          </div>
        </header>

        <div className="mt-3">
          <RadiusChips />
        </div>

        <div className="mt-4">
          <FeedShowcase heroes={heroes} signedIn initialSavedIds={profile?.savedStoreIds ?? []} />
        </div>

        <LiveFeed posts={feedPosts} />
      </main>
    </div>
  )
}
