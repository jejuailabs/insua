import { getTranslations } from 'next-intl/server'
import { SignOutButton } from './SignOutButton'

/**
 * M2 에서 역할별 홈으로 리다이렉트할 대상이 필요해 만든 임시 화면.
 * M4(CRM) · M5(소상공인) · M6(소비자) 에서 실제 화면으로 교체된다.
 */
export async function StubScreen({ titleKey }: { titleKey: string }) {
  const t = await getTranslations()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-title text-content">{t(titleKey)}</h1>
      <p className="mt-2 text-body text-content-muted">{t('common.comingSoon')}</p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  )
}
