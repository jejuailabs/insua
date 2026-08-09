import { setRequestLocale } from 'next-intl/server'
import { AdminPeekBanner } from '@/components/admin/AdminPeekBanner'
import { CrmAssistant } from '@/components/crm/CrmAssistant'
import { CrmScreen } from '@/components/crm/CrmScreen'
import { SideRail } from '@/components/layout/SideRail'
import { requireRolePage } from '@/lib/auth/guards'
import { listContacts } from '@/lib/crm/data'

export const maxDuration = 60

/** 설계사 CRM (docs/06, ref-03) — Firestore 실데이터. */
export default async function CrmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireRolePage(locale, ['agent'])

  const contacts = await listContacts(session.uid)

  return (
    <div className="flex">
      <SideRail variant="agent" active="crm" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <AdminPeekBanner />
        <CrmScreen contacts={contacts} />
      </main>
      {/* RAG 챗봇 — 내 고객·상담 데이터 자연어 질의 (사용자 확정 사양) */}
      <CrmAssistant />
    </div>
  )
}
