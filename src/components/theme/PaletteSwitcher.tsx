'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { PALETTES } from '@/lib/theme/palette'
import { cn } from '@/lib/utils/cn'
import { usePalette } from './PaletteProvider'

/**
 * 팔레트 4종 선택 (docs/04 §2.2).
 * 각 칩은 해당 팔레트의 강조색을 미리보기로 보여준다. 색 미리보기는 data-palette 를
 * 칩 자체에 걸어 tokens.css 가 계산하게 한다 — TS 에 색을 복제하지 않기 위해서다.
 *
 * 다크 모드일 때 스와치에 `dark` 클래스도 같이 붙인다. 팔레트 규칙이
 * `.dark[data-palette='gyul']` 처럼 **한 요소에 둘 다** 요구하기 때문이다.
 * data-palette 만 걸면 다크 화면에서 라이트 강조색이 찍힌다.
 */
export function PaletteSwitcher() {
  const t = useTranslations('theme')
  const { resolvedTheme } = useTheme()
  const { palette, setPalette, mounted } = usePalette()

  return (
    <div role="radiogroup" aria-label={t('palette')} className="flex flex-wrap gap-2">
      {PALETTES.map((id) => {
        const active = mounted && palette === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPalette(id)}
            className={cn(
              'flex items-center gap-2 rounded-chip border px-3 py-2 text-label transition-colors',
              active
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-content-muted hover:text-content',
            )}
          >
            <span
              data-palette={id}
              className={cn(
                'h-4 w-4 rounded-pill border border-line-strong bg-accent',
                mounted && resolvedTheme === 'dark' && 'dark',
              )}
              aria-hidden
            />
            {t(`paletteName.${id}`)}
          </button>
        )
      })}
    </div>
  )
}
