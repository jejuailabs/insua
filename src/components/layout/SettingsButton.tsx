'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { PaletteSwitcher } from '@/components/theme/PaletteSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Modal } from '@/components/ui/Modal'

/**
 * 화면 밝기·색상 테마·언어를 헤더 아이콘 하나로 접는다 (docs/04 §6).
 * 본문에 늘어놓으면 개발용 위젯처럼 보인다 — 마이페이지가 생기면 그리로 옮긴다.
 */
export function SettingsButton() {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('settings')}
        className="grid h-10 w-10 place-items-center rounded-pill text-content-muted hover:bg-surface-2"
      >
        <SlidersHorizontal size={20} aria-hidden />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('settings')}>
        <div className="flex flex-col gap-4">
          <ThemeToggle />
          <PaletteSwitcher />
          <LocaleSwitcher />
        </div>
      </Modal>
    </>
  )
}
