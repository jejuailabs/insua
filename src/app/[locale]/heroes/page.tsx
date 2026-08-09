import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HeroesHub } from '@/components/heroes/HeroesHub'
import { SideRail } from '@/components/layout/SideRail'
import { getSession } from '@/lib/auth/session'
import { getMyConsumerProfile } from '@/lib/consumer/actions'
import { getVisitCounts } from '@/lib/consumer/visits'
import { listHeroes } from '@/lib/stores/data'

/**
 * 히어로 허브 (docs/08 §3 + 사용자 확정 사양) — 우리동네 로컬 히어로 피드.
 * 공개 화면. 로그인했으면 찜·방문 단골 등급이 함께 내려간다.
 * 최대 50장(5km 캡)을 한 번에 내려주고, 그리기는 클라이언트가 10장씩 나눠 한다.
 */
export default async function HeroesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  const [t, heroes, profile, visitCounts] = await Promise.all([
    getTranslations(),
    listHeroes(50),
    session ? getMyConsumerProfile() : null,
    session ? getVisitCounts(session.uid) : {},
  ])

  return (
    <div className="flex">
      <SideRail variant="consumer" active="heroes" homeHref="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10 lg:max-w-5xl">
        <h1 className="text-display text-content">{t('nav.heroes')}</h1>

        <HeroesHub
          heroes={heroes}
          signedIn={Boolean(session)}
          initialSavedIds={profile?.savedStoreIds ?? []}
          visitCounts={visitCounts}
        />
      </main>
    </div>
  )
}
