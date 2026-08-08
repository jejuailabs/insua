'use client'

import { ThemeProvider } from 'next-themes'
import { PaletteProvider } from './PaletteProvider'
import { ThemeColorMeta } from './ThemeColorMeta'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class" // .dark 클래스 부착 (docs/04 §6.2)
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange // 전환 시 색 애니메이션 잔상 방지
    >
      <PaletteProvider>
        <ThemeColorMeta />
        {children}
      </PaletteProvider>
    </ThemeProvider>
  )
}
