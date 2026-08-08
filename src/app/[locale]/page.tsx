import { Bell } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthLauncher } from '@/components/auth/AuthLauncher'
import { FeedShowcase } from '@/components/home/FeedShowcase'
import { SettingsButton } from '@/components/layout/SettingsButton'
import { getSession } from '@/lib/auth/session'
import { HEROES } from '@/lib/mock/home'

/**
 * 메인 (docs/08, ref-04).
 *
 * **로그인 화면으로 튕기지 않는다.** 로그인 없이도 동네 히어로와 마켓이 다 보이고,
 * 로그인은 우측 하단 버튼에서 모달로만 시작한다 — 첫 화면이 로그인 폼이면 아무도 안 본다.
 *
 * 테마·언어 같은 설정은 헤더 아이콘 안으로 접는다. 본문에 늘어놓지 않는다.
 *
 * 세션을 읽으므로 정적 생성은 불가능하다. generateStaticParams 를 두지 않는다.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  const t = await getTranslations()

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">
        <header className="flex items-center justify-between">
          <h1 className="text-display leading-tight text-accent-strong">{t('consumer.brand')}</h1>
          <div className="flex items-center gap-1">
            <SettingsButton />
            <span className="grid h-10 w-10 place-items-center rounded-pill text-content-muted">
              <Bell size={20} aria-hidden />
            </span>
          </div>
        </header>

        <div className="mt-4">
          <FeedShowcase heroes={HEROES} />
        </div>
      </main>

      <AuthLauncher signedIn={Boolean(session)} role={session?.role ?? null} />
    </>
  )
}
