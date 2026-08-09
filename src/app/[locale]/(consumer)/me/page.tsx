import { ChevronRight, CircleUser, Heart } from 'lucide-react'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AgentSection } from '@/components/consumer/AgentSection'
import { ApplyMerchantButton } from '@/components/consumer/ApplyMerchantButton'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { SideRail } from '@/components/layout/SideRail'
import { SignOutButton } from '@/components/layout/SignOutButton'
import { PaletteSwitcher } from '@/components/theme/PaletteSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { requireRolePage } from '@/lib/auth/guards'
import { Link } from '@/lib/i18n/navigation'
import { getMyConsumerProfile } from '@/lib/consumer/actions'

/** 마이페이지 (docs/08 §9) — 프로필·언어·테마·담당 설계사·로그아웃. */
export default async function MePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRolePage(locale, ['consumer'])

  const profile = await getMyConsumerProfile()
  const t = await getTranslations()

  return (
    <div className="flex">
      <SideRail variant="consumer" active="me" homeHref="/feed" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4 pb-10 lg:max-w-xl">
        <AdminPeekBanner />
        <h1 className="text-display text-content">{t('nav.myPage')}</h1>

        <section className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <span className="grid h-12 w-12 place-items-center rounded-pill bg-surface-2 text-content-muted">
            <CircleUser size={26} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-label text-content-muted">{t('consumer.myProfile')}</p>
            <p className="truncate text-subtitle text-content">{profile?.email}</p>
          </div>
        </section>

        {/* 찜한가게 — 레일에서 마이페이지로 이동 (사용자 확정 사양) */}
        <Link
          href="/saved"
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-4"
        >
          <Heart size={18} aria-hidden className="text-accent-strong" />
          <span className="flex-1 text-subtitle text-content">{t('nav.saved')}</span>
          <span className="tabular text-caption text-content-muted">
            {profile?.savedStoreIds.length ?? 0}
          </span>
          <ChevronRight size={16} aria-hidden className="text-content-muted" />
        </Link>

        <AgentSection currentAgentId={profile?.agentId ?? null} />

        {/* 소상공인 전환 신청 — 역할 부여는 관리자 승인으로만 (사용자 확정 사양) */}
        <section className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <h2 className="text-subtitle text-content">{t('consumer.applyMerchant')}</h2>
          <p className="text-caption text-content-muted">{t('consumer.applyMerchantDesc')}</p>
          <ApplyMerchantButton applied={profile?.merchantApplied ?? false} />
        </section>

        <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <h2 className="text-subtitle text-content">{t('nav.settings')}</h2>
          <ThemeToggle />
          <PaletteSwitcher />
          <LocaleSwitcher />
        </section>

        <div>
          <SignOutButton />
        </div>
      </main>
    </div>
  )
}
