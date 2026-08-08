'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { adminSetRole } from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/data'
import { ROLES, type Role } from '@/types/user'
import { cn } from '@/lib/utils/cn'

/** 회원 테이블 (docs/09 §2.2). 역할 변경은 서버 액션 + 감사 로그 경유. */
export function UserTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function changeRole(uid: string, value: string) {
    const role = value === '' ? null : (value as Role)
    setBusyUid(uid)
    startTransition(async () => {
      const result = await adminSetRole(uid, role)
      setBusyUid(null)
      if (result.ok) {
        setToast(t('admin.roleUpdated'))
        setTimeout(() => setToast(null), 2000)
        router.refresh()
      }
    })
  }

  if (!users.length) {
    return (
      <p className="rounded-card border border-line bg-surface p-8 text-center text-body text-content-muted">
        {t('admin.noUsers')}
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li
            key={user.uid}
            className={cn(
              'flex items-center gap-3 rounded-inner border border-line bg-surface p-3',
              busyUid === user.uid && 'opacity-60',
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-label text-content">
                {user.displayName || user.email}
                {user.isAdmin && (
                  <span className="ml-2 rounded-chip bg-accent-soft px-1.5 py-0.5 text-micro text-accent-strong">
                    {t('admin.title')}
                  </span>
                )}
              </p>
              <p className="truncate text-micro text-content-muted">{user.email}</p>
            </div>

            <label className="flex shrink-0 items-center gap-1.5 text-micro text-content-muted">
              {t('admin.roleChange')}
              <select
                value={user.role ?? ''}
                disabled={pending}
                onChange={(e) => changeRole(user.uid, e.target.value)}
                className="min-h-9 rounded-chip border border-line bg-surface px-2 text-label text-content"
              >
                <option value="">{t('admin.roleNone')}</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`onboarding.${role}.title`)}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>

      {toast && (
        <p
          role="status"
          className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-content px-4 py-2 text-label text-surface shadow-card"
        >
          {toast}
        </p>
      )}
    </>
  )
}
