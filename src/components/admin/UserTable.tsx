'use client'

import { ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { adminDeleteUser, adminSetAdmin, adminSetRole } from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/data'
import { Modal } from '@/components/ui/Modal'
import { ROLES, type Role } from '@/types/user'
import { cn } from '@/lib/utils/cn'

/** 회원 테이블 (docs/09 §2.2). 역할 변경·관리자 지정은 서버 액션 + 감사 로그 경유. */
export function UserTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // 삭제는 되돌릴 수 없다 — 확인 다이얼로그를 거치지 않고는 실행되지 않는다 (docs/09 §4)
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null)

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

  /** 회원 삭제 — Auth 계정까지 지워 같은 지메일로 새로 가입할 수 있게 한다. */
  function deleteUser(user: AdminUserRow) {
    setBusyUid(user.uid)
    startTransition(async () => {
      const result = await adminDeleteUser(user.uid)
      setBusyUid(null)
      setPendingDelete(null)
      setToast(result.ok ? t('admin.deleteUserDone') : t('admin.deleteUserFailed'))
      setTimeout(() => setToast(null), 2400)
      if (result.ok) router.refresh()
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

              {/* 회원 삭제 — 파괴적이라 아웃라인. 채운 배경은 확인창 안에서만 (docs/09 §4) */}
              <button
                type="button"
                disabled={pending}
                onClick={() => setPendingDelete(user)}
                className="flex items-center gap-1 rounded-chip border border-danger px-2.5 py-1 text-micro text-danger"
              >
                <Trash2 size={12} aria-hidden />
                {t('admin.deleteUser')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('admin.deleteUserTitle')}
        description={pendingDelete?.email ?? undefined}
      >
        <p className="text-body text-content">{t('admin.deleteUserWarning')}</p>
        <p className="mt-2 text-caption text-content-muted">{t('admin.deleteUserKeepsContent')}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="min-h-11 rounded-chip border border-line px-4 py-2 text-label text-content-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => pendingDelete && deleteUser(pendingDelete)}
            className="min-h-11 rounded-chip bg-danger px-4 py-2 text-label text-white disabled:opacity-60"
          >
            {t('admin.deleteUserConfirm')}
          </button>
        </div>
      </Modal>

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
