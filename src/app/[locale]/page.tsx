import { Bell } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthLauncher } from '@/components/auth/AuthLauncher'
import { consumerRail } from '@/components/home/consumerRail'
import { LiveFeed } from '@/components/feed/LiveFeed'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { RadiusChips } from '@/components/home/RadiusChips'
import { SettingsButton } from '@/components/layout/SettingsButton'
import { SideRail } from '@/components/layout/SideRail'
import { getSession } from '@/lib/auth/session'
import { listFeedPosts } from '@/lib/feed/data'
import { getMyConsumerProfile } from '@/lib/consumer/actions'
import { listHeroes } from '@/lib/stores/data'

/**
 * 메인 (docs/08, ref-04).
 *
 * **로그인 화면으로 튕기지 않는다.** 로그인 없이도 동네 히어로와 마켓이 다 보이고,
 * 로그인은 우측 하단 버튼에서 모달로만 시작한다 — 첫 화면이 로그인 폼이면 아무도 안 본다.
 * 좌측 레일(ref-04)은 공개 화면에도 그대로 있다. 찜·마이페이지는 로그인 유도로 이어진다.
 *
 * 세션을 읽으므로 정적 생성은 불가능하다. generateStaticParams 를 두지 않는다.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  const profile = session ? await getMyConsumerProfile() : null
  const heroes = await listHeroes()
  const feedPosts = await listFeedPosts()
  const t = await getTranslations()

  return (
    <>
      <div className="flex">
        <SideRail items={consumerRail('home', '/')} />

        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28">
          <header className="flex items-start justify-between">
            <h1 className="text-display leading-[0.95] tracking-[-0.04em] text-accent-strong">
              LOCAL
              <br />
              HERO
            </h1>
            <div className="flex items-center gap-1">
              <SettingsButton />
              <span className="grid h-10 w-10 place-items-center rounded-pill text-content-muted">
                <Bell size={20} aria-hidden />
              </span>
            </div>
          </header>
          <span className="sr-only">{t('consumer.brand')}</span>

          <div className="mt-3">
            <RadiusChips />
          </div>

          <div className="mt-4">
            <FeedShowcase
              heroes={heroes}
              signedIn={Boolean(session)}
              initialSavedIds={profile?.savedStoreIds ?? []}
            />
          </div>

          <LiveFeed posts={feedPosts} />
        </main>
      </div>

      <AuthLauncher signedIn={Boolean(session)} role={session?.role ?? null} />
    </>
  )
}
