import {
  Bell,
  ChevronRight,
  Home as HomeIcon,
  ImageIcon,
  Landmark,
  CreditCard,
  MessagesSquare,
  Music,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { requireRolePage } from '@/lib/auth/guards'
import { ANONYMOUS_ROOM, GROUP_BUYS, REALTY_LISTINGS, SUPPORT_PROGRAMS } from '@/lib/mock/merchant'

/** 소상공인 커뮤니티 홈 (docs/07 A, ref-02). 목데이터 단계 — 실데이터는 M5 후반. */
export default async function MerchantHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['merchant'])

  const t = await getTranslations()

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-4 pb-32">
        <header className="flex items-center justify-between">
          <p className="text-subtitle text-content">{t('merchant.spaceName')}</p>
          <span className="flex items-center gap-1 text-content-muted">
            <span className="grid h-10 w-10 place-items-center">
              <Search size={20} aria-hidden />
            </span>
            <span className="grid h-10 w-10 place-items-center">
              <Bell size={20} aria-hidden />
            </span>
          </span>
        </header>

        <h1 className="mt-3 text-title text-content">{t('merchant.greeting')}</h1>
        <p className="mt-1 text-caption text-content-muted">{t('merchant.greetingSub')}</p>

        {/* 퀵액션 6칸 (docs/07 A-3) — 모바일 3×2 */}
        <QuickActions />

        {/* 익명방 강조 카드 (docs/07 A-4) — 이 화면에서 유일하게 강조색을 통째로 쓴다 */}
        <section className="mt-5 rounded-card bg-accent p-4 text-accent-on">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-subtitle">{t('anonymous.roomName')}</h2>
              <p className="mt-0.5 text-caption opacity-85">{t('anonymous.desc')}</p>
              <p className="mt-1 text-caption opacity-85">
                {t('anonymous.liveCount', { count: ANONYMOUS_ROOM.liveCount })}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-pill bg-black/20 px-3 py-1.5 text-label">
              {t('anonymous.enter')}
              <ChevronRight size={14} aria-hidden />
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-1.5">
            {ANONYMOUS_ROOM.posts.map((post) => (
              <li key={post.id} className="rounded-inner bg-white/10 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-label">{post.title}</p>
                  <span className="flex shrink-0 items-center gap-1 text-micro opacity-85">
                    <MessagesSquare size={12} aria-hidden />
                    {post.comments}
                  </span>
                </div>
                <p className="mt-0.5 text-micro opacity-70">
                  {t('anonymous.author')} ·{' '}
                  {post.minutesAgo >= 60
                    ? t('common.hoursAgo', { n: Math.floor(post.minutesAgo / 60) })
                    : t('common.minutesAgo', { n: post.minutesAgo })}
                </p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-pill bg-black/25 text-label"
          >
            {t('merchant.enterAnonymous')}
          </button>

          <p className="mt-3 text-micro opacity-75">{t('anonymous.notice')}</p>
        </section>

        {/* 부동산 (docs/07 A-5) */}
        <section className="mt-6">
          <SectionHeader title={t('realty.section')} sub={t('realty.sectionSub')} />
          <ul className="-mx-4 mt-3 flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
            {REALTY_LISTINGS.map((listing) => (
              <li
                key={listing.id}
                className="w-40 shrink-0 overflow-hidden rounded-inner border border-line bg-surface"
              >
                <div className="relative aspect-[3/2]">
                  <Image src={listing.image} alt="" fill sizes="160px" className="object-cover" />
                  <span className="absolute top-1.5 left-1.5 rounded-chip bg-accent-strong px-1.5 py-0.5 text-micro text-accent-on">
                    {t(`realty.${listing.kind}`)}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-label text-content">{listing.title}</p>
                  <p className="tabular mt-1 text-label text-content">{listing.priceMain}</p>
                  <p className="tabular mt-0.5 text-micro text-content-muted">{listing.priceSub}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 정부지원 (docs/07 A-5) — sourceUrl 없는 레코드는 렌더하지 않는다 */}
        <section className="mt-6">
          <SectionHeader title={t('support.section')} sub={t('support.sectionSub')} />
          <ul className="mt-3 flex flex-col overflow-hidden rounded-card border border-line bg-surface">
            {SUPPORT_PROGRAMS.filter((p) => p.sourceUrl).map((program, i) => (
              <li key={program.id} className={i > 0 ? 'border-t border-line' : undefined}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-accent-soft text-accent-strong">
                    {program.kind === 'grant' ? (
                      <Landmark size={18} aria-hidden />
                    ) : (
                      <CreditCard size={18} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label text-content">{program.title}</p>
                    <p className="tabular mt-0.5 text-caption text-content-muted">
                      {program.summary}
                    </p>
                  </div>
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-content-muted" />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-micro text-content-faint">{t('support.sourceNotice')}</p>
        </section>

        {/* AI Tools (docs/10 — 실호출 없음, 입구만) */}
        <section className="mt-6">
          <SectionHeader title={t('aiTools.section')} />
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {[
              { icon: ImageIcon, label: t('aiTools.menuPoster') },
              { icon: Music, label: t('aiTools.themeSong') },
              {
                icon: Wand2,
                label: t('aiTools.virtualStudio'),
                sub: t('aiTools.virtualStudioSub'),
              },
            ].map(({ icon: Icon, label, sub }) => (
              <li
                key={label}
                className="flex flex-col items-center justify-center gap-1.5 rounded-inner border border-line bg-surface-2 px-2 py-4 text-center"
              >
                <Icon size={20} aria-hidden className="text-accent-strong" />
                <span className="text-label text-content">{label}</span>
                {sub && <span className="text-micro text-content-muted">{sub}</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* 공동구매 (docs/07 A-5) */}
        <section className="mt-6">
          <SectionHeader title={t('groupBuy.section')} sub={t('groupBuy.sectionSub')} />
          <ul className="mt-3 flex flex-col gap-3">
            {GROUP_BUYS.map((gb) => (
              <li
                key={gb.id}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-inner">
                  <Image src={gb.image} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label text-content">{gb.title}</p>
                  <p className="mt-0.5 text-caption text-content-muted">
                    {t('groupBuy.deadline', { days: gb.daysLeft })} ·{' '}
                    {t('groupBuy.participants', { count: gb.participants })}
                  </p>
                </div>
                <span className="shrink-0 rounded-chip bg-accent-soft px-2 py-1 text-label text-accent-strong">
                  {t('groupBuy.discountUpTo', { rate: gb.discountRate })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <BottomTabBar />
    </>
  )
}

/** 퀵액션 6칸. 대상 화면은 이번 스코프 밖이라 타일만 둔다 (docs/07 A-3). */
async function QuickActions() {
  const t = await getTranslations()
  const items = [
    { icon: MessagesSquare, label: t('merchant.quick.anonymous') },
    { icon: HomeIcon, label: t('merchant.quick.realty') },
    { icon: Landmark, label: t('merchant.quick.support') },
    { icon: ShoppingCart, label: t('merchant.quick.groupbuy') },
    { icon: Sparkles, label: t('merchant.quick.aitools') },
    { icon: Share2, label: t('merchant.quick.share') },
  ]

  // ref-02 는 모바일에서도 6칸 한 줄이다.
  return (
    <ul className="mt-4 grid grid-cols-6 gap-1.5">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex flex-col items-center justify-center gap-1 rounded-inner border border-line bg-surface-2 px-0.5 py-2.5"
        >
          <Icon size={18} aria-hidden className="text-content" />
          <span className="w-full truncate text-center text-micro text-content-muted">{label}</span>
        </li>
      ))}
    </ul>
  )
}
