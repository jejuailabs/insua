import { Bell } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthLauncher } from '@/components/auth/AuthLauncher'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { SettingsButton } from '@/components/layout/SettingsButton'
import { SideRail } from '@/components/layout/SideRail'
import { getSession } from '@/lib/auth/session'
import { listFeedPosts } from '@/lib/feed/data'
import { listRandomProducts } from '@/lib/market/data'
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
export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ login?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  const { login } = await searchParams
  // 직렬 대기가 메인 TTFB 를 잡아먹는다 — 전부 병렬로 (사용자 성능 피드백)
  const [profile, heroes, feedPosts, products, t] = await Promise.all([
    session ? getMyConsumerProfile() : Promise.resolve(null),
    listHeroes(20), // 메인 캐러셀 최대 20장 (사용자 확정 사양)
    listFeedPosts(12),
    listRandomProducts(6),
    getTranslations(),
  ])

  return (
    <>
      <div className="flex">
        <SideRail variant="consumer" active="home" homeHref="/" />

        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28 lg:max-w-4xl">
          <header className="flex items-start justify-between">
            <h1 className="text-title tracking-[-0.03em] text-accent-strong">LOCAL HERO</h1>
            <div className="flex items-center gap-1">
              <SettingsButton />
              <span className="grid h-10 w-10 place-items-center rounded-pill text-content-muted">
                <Bell size={20} aria-hidden />
              </span>
            </div>
          </header>
          <span className="sr-only">{t('consumer.brand')}</span>

          <div className="mt-4">
            <FeedShowcase
              heroes={heroes}
              products={products}
              signedIn={Boolean(session)}
              initialSavedIds={profile?.savedStoreIds ?? []}
            />
          </div>

          <FeedGrid initialPosts={feedPosts} />
        </main>
      </div>

      <AuthLauncher
        signedIn={Boolean(session)}
        role={session?.role ?? null}
        isAdmin={session?.isAdmin === true}
        initialLoginOpen={login === '1'}
      />
    </>
  )
}
