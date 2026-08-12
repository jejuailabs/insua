import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

/**
 * locale 아래의 매칭되지 않는 모든 경로를 받아 404 로 넘긴다.
 *
 * 이게 없으면 Next 의 **기본** 404(영문 하드코딩, 우리 토큰·번역 없음)가 뜬다.
 * `[locale]/not-found.tsx` 는 `notFound()` 가 locale 컨텍스트 안에서 호출될 때만 렌더되기 때문이다.
 */
export default async function CatchAllPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  notFound()
}
