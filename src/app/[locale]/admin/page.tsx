import { FileWarning, Landmark, ScrollText, ShieldAlert, Users } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { UserTable } from '@/components/admin/UserTable'
import { listAuditLogs, listUsers } from '@/lib/admin/data'
import { getSession } from '@/lib/auth/session'
import { Link, redirect } from '@/lib/i18n/navigation'
import { ROLE_HOME } from '@/types/user'
import { cn } from '@/lib/utils/cn'

/**
 * 어드민 콘솔 (docs/09). 판정은 서버 세션의 admin 클레임 — 클라이언트 분기 금지 (CLAUDE.md §3-2).
 * 회원·감사 로그는 실데이터. 콘텐츠·신고·지원정보는 데이터가 아직 없어 빈 상태.
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getSession()
  if (!session) return redirect({ href: '/login', locale })
  if (!session.isAdmin) {
    return redirect({ href: session.role ? ROLE_HOME[session.role] : '/onboarding', locale })
  }

  const { tab = 'users' } = await searchParams
  const t = await getTranslations()

  const tabs = [
    { id: 'users', icon: Users, label: t('admin.users') },
    { id: 'content', icon: FileWarning, label: t('admin.content') },
    { id: 'reports', icon: ShieldAlert, label: t('admin.reports') },
    { id: 'support', icon: Landmark, label: t('admin.supportPrograms') },
    { id: 'audit', icon: ScrollText, label: t('admin.auditLogs') },
  ]

  const [users, logs] = await Promise.all([
    tab === 'users' ? listUsers() : Promise.resolve([]),
    tab === 'audit' ? listAuditLogs() : Promise.resolve([]),
  ])

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 pb-10">
      {/* 어드민 배너 — 지금 권한이 다르다는 걸 항상 보이게 (docs/09 §1) */}
      <p className="rounded-chip bg-warning/15 px-3 py-2 text-caption text-content">
        {t('admin.banner')}
      </p>

      <h1 className="mt-3 text-display text-content">{t('admin.title')}</h1>

      <nav className="mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ id, icon: Icon, label }) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-chip border px-3 py-2 text-label',
              tab === id
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-line text-content-muted',
            )}
          >
            <Icon size={15} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4">
        {tab === 'users' && <UserTable users={users} />}

        {tab === 'audit' &&
          (logs.length ? (
            <ul className="flex flex-col gap-2">
              {logs.map((log) => (
                <li key={log.id} className="rounded-inner border border-line bg-surface p-3">
                  <p className="flex items-center justify-between gap-2 text-label text-content">
                    {log.action}
                    <span className="tabular text-micro text-content-muted">
                      {log.at ? new Date(log.at).toLocaleString(locale) : ''}
                    </span>
                  </p>
                  <p className="mt-1 truncate text-micro text-content-muted">
                    {log.actorEmail} → {log.targetUid}
                    {log.before !== log.after && ` · ${log.before ?? '—'} → ${log.after ?? '—'}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBox text={t('admin.noLogs')} />
          ))}

        {tab === 'content' && <EmptyBox text={t('admin.contentEmpty')} />}
        {tab === 'reports' && <EmptyBox text={t('admin.reportsEmpty')} />}
        {tab === 'support' && <EmptyBox text={t('support.sourceNotice')} />}
      </div>
    </main>
  )
}

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
      {text}
    </p>
  )
}
