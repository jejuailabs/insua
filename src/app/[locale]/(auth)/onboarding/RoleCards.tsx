'use client'

import { Store, User, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { refreshSessionAfterClaimChange } from '@/lib/auth/signIn'
import { cn } from '@/lib/utils/cn'
import { ROLE_HOME, ROLES, type Role } from '@/types/user'
import { setRole } from './actions'

const ROLE_ICON = { agent: Users, merchant: Store, consumer: User } as const

export function RoleCards({ locale }: { locale: string }) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [chosen, setChosen] = useState<Role | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  function choose(role: Role) {
    setChosen(role)
    setErrorKey(null)

    startTransition(async () => {
      const result = await setRole(role)
      if (!result.ok) {
        setErrorKey(result.code === 'ALREADY_SET' ? 'error.alreadySet' : 'error.alreadySet')
        setChosen(null)
        return
      }

      // 커스텀 클레임이 바뀌었으니 토큰과 세션 쿠키를 새로 받아야 한다 (docs/03 §3).
      // 이걸 빼면 미들웨어·서버가 아직 role 없는 세션을 보고 온보딩으로 되돌린다.
      await refreshSessionAfterClaimChange()

      router.replace(`/${locale}${ROLE_HOME[role]}`)
      router.refresh()
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {ROLES.map((role) => {
        const Icon = ROLE_ICON[role]
        const active = chosen === role
        return (
          <button
            key={role}
            type="button"
            disabled={pending}
            onClick={() => choose(role)}
            className={cn(
              'rounded-card border p-4 text-left transition-colors',
              'flex items-start gap-4 disabled:opacity-60',
              active
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface hover:border-accent',
            )}
          >
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-surface-2',
                active && 'text-accent-strong',
              )}
            >
              <Icon size={22} aria-hidden />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-subtitle text-content">{t(`${role}.title`)}</span>
              <span className="text-caption text-content-muted">{t(`${role}.desc`)}</span>
            </span>
          </button>
        )
      })}

      {pending && (
        <p className="text-caption text-content-muted" role="status">
          {t('submitting')}
        </p>
      )}
      {errorKey && (
        <p role="alert" className="text-caption text-danger">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
