import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { PaletteSwitcher } from '@/components/theme/PaletteSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { routing } from '@/lib/i18n/routing'

/**
 * 토큰 확인용 임시 페이지 (docs/11 M1).
 * 8개 테마 조합에서 색·타이포·대비를 눈과 스크립트로 확인하는 용도다.
 * 실제 컴포넌트(HeroCarousel 등)는 M3 에서 여기에 붙인다.
 *
 * 경로가 `_kitchen-sink` 가 아닌 이유: App Router 에서 `_` 로 시작하는 폴더는
 * private folder 라 라우팅되지 않는다.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const SURFACES = ['bg', 'surface', 'surface-2', 'surface-raised'] as const
// 문자열 보간으로 클래스를 만들면 Tailwind 가 빌드 시점에 못 찾는다. 반드시 통짜로 적는다.
// 세 번째 값은 대비 검사 제외 여부. content-faint 는 비활성 전용이라 WCAG 대비 요건 대상이 아니다.
const TEXTS = [
  ['content', 'text-content', false],
  ['content-muted', 'text-content-muted', false],
  ['content-faint', 'text-content-faint', true],
] as const
const TIERS = ['S', 'A', 'B', 'C'] as const

/**
 * 폰트 표본. 번역 대상 UI 카피가 아니라 한글·영문·숫자 글리프를 눈으로 확인하기 위한 문자열이다.
 * 이 페이지는 개발 전용이므로 messages/ 를 거치지 않는다 (CLAUDE.md §3-3 의 개발용 예외).
 */
const FONT_SPECIMEN = '제주 해녀밥상 ABC 0123456789'
const TYPE_SCALE = [
  'text-display',
  'text-title',
  'text-subtitle',
  'text-body',
  'text-label',
  'text-caption',
  'text-micro',
] as const

// 배경 + 그 위 텍스트색을 한 쌍으로 묶는다. 흰 텍스트는 4개 전부 대비 미달이다 (docs/04 §5.2).
const TIER_CLASS: Record<(typeof TIERS)[number], string> = {
  S: 'bg-tier-s text-tier-s-on',
  A: 'bg-tier-a text-tier-a-on',
  B: 'bg-tier-b text-tier-b-on',
  C: 'bg-tier-c text-tier-c-on',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-micro text-content-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export default async function KitchenSinkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-title text-content">kitchen-sink</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <div className="mt-3">
        <PaletteSwitcher />
      </div>

      <Section title="surface">
        <div className="flex flex-wrap gap-2">
          {SURFACES.map((name) => (
            <div key={name} className="rounded-inner border border-line px-3 py-6">
              <span className="text-caption text-content-faint">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="text">
        <div className="flex flex-col gap-1">
          {TEXTS.map(([name, cls, exempt]) => (
            <span
              key={name}
              className={`text-body ${cls}`}
              data-token={name}
              data-contrast-exempt={exempt || undefined}
            >
              {name} — {FONT_SPECIMEN}
            </span>
          ))}
        </div>
      </Section>

      <Section title="type scale">
        <ul className="flex flex-col gap-1">
          {TYPE_SCALE.map((cls) => (
            <li key={cls} className={`text-content ${cls}`}>
              {cls} — {FONT_SPECIMEN}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="tier">
        <div className="flex flex-wrap gap-2">
          {TIERS.map((tier) => (
            <span key={tier} className={`rounded-pill px-2.5 py-1 text-label ${TIER_CLASS[tier]}`}>
              {t(`tier.${tier}`)}
            </span>
          ))}
        </div>
      </Section>

      <Section title="button / accent">
        <div className="flex flex-wrap items-center gap-2">
          {/* 채운 버튼은 --accent 가 아니라 --accent-strong 을 쓴다. 대비 4.5:1 확보 (docs/04 §2.2) */}
          <button
            type="button"
            className="rounded-chip bg-accent-strong px-4 py-2 text-label text-accent-on"
          >
            {t('common.save')}
          </button>
          {/* 면 위의 강조색 텍스트도 --accent 로는 라이트에서 3:1 대로 떨어진다 */}
          <button
            type="button"
            className="rounded-chip border border-accent px-4 py-2 text-label text-accent-strong"
          >
            {t('common.cancel')}
          </button>
          <span className="rounded-chip bg-accent-soft px-4 py-2 text-label text-accent-strong">
            accent-soft
          </span>
          {/* --accent 원색은 링·글로우·면 같은 장식에만 쓴다. 글자를 얹지 않는다. */}
          <span className="inline-flex items-center gap-2 text-label text-content-muted">
            <span className="h-8 w-8 rounded-chip bg-accent" aria-hidden />
            accent (decorative)
          </span>
        </div>
      </Section>

      <Section title="i18n">
        <ul className="flex flex-col gap-1 text-body text-content">
          <li>{t('crm.dueSoon', { count: 3 })}</li>
          <li>{t('merchant.greeting')}</li>
          <li>{t('anonymous.liveCount', { count: 342 })}</li>
          <li>{t('groupBuy.discountUpTo', { rate: 28 })}</li>
          <li>{t('support.sourceNotice')}</li>
        </ul>
      </Section>
    </main>
  )
}
