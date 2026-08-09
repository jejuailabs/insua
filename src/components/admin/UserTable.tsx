'use client'

import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { adminSetAdmin, adminSetRole } from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/data'
import { ROLES, type Role } from '@/types/user'
import { cn } from '@/lib/utils/cn'

/** 회원 테이블 (docs/09 §2.2). 역할 변경·관리자 지정은 서버 액션 + 감사 로그 경유. */
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

  /** 관리자 지정/해제 — 지정된 어드민은 화면별 보기(3개 모드)를 바로 쓸 수 있다. */
  function toggleAdmin(uid: string, makeAdmin: boolean) {
    setBusyUid(uid)
    startTransition(async () => {
      const result = await adminSetAdmin(uid, makeAdmin)
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

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <label className="flex items-center gap-1.5 text-micro text-content-muted">
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

              {/* 관리자 지정/해제 (사용자 확정 사양) — 지정 시 화면별 보기 자동 부여 */}
              <button
                type="button"
                disabled={pending}
                onClick={() => toggleAdmin(user.uid, !user.isAdmin)}
                className={cn(
                  'flex items-center gap-1 rounded-chip border px-2.5 py-1 text-micro',
                  user.isAdmin
                    ? 'border-accent bg-accent-soft text-accent-strong'
                    : 'border-line text-content-muted',
                )}
              >
                <ShieldCheck size={12} aria-hidden />
                {user.isAdmin ? t('admin.revokeAdmin') : t('admin.grantAdmin')}
              </button>
            </div>
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
