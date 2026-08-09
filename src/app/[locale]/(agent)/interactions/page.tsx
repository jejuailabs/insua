import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { InteractionsScreen } from '@/components/crm/InteractionsScreen'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { listContacts, listInteractions } from '@/lib/crm/data'

export const maxDuration = 60

/** 상담로그 (docs/06 §7). */
export default async function InteractionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ contactId?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['agent'])

  const { contactId } = await searchParams
  const contacts = await listContacts(session.uid)
  const selectedId =
    contactId && contacts.some((c) => c.id === contactId) ? contactId : (contacts[0]?.id ?? null)
  const interactions = selectedId ? await listInteractions(session.uid, selectedId) : []

  const t = await getTranslations('nav')

  return (
    <div className="flex">
      <SideRail variant="agent" active="interactions" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <AdminPeekBanner />
        <h1 className="mb-4 text-display text-content">{t('interactions')}</h1>
        <InteractionsScreen
          contacts={contacts}
          selectedId={selectedId}
          interactions={interactions}
        />
      </main>
    </div>
  )
}
