import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/** 404 (docs/11 M8). 없는 주소라는 사실과 나갈 길만 준다. */
export default async function LocaleNotFound() {
  const t = await getTranslations()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-title text-content">{t('notFound.title')}</h1>
      <p className="mt-2 text-body text-content-muted">{t('notFound.body')}</p>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-chip bg-accent-strong px-5 py-3 text-label text-accent-on"
        >
          {t('notFound.home')}
        </Link>
      </div>
    </main>
  )
}
