import type { MetadataRoute } from 'next'
import { routing } from '@/lib/i18n/routing'
import { listPublishedStoreIds } from '@/lib/stores/data'

const SITE = 'https://insua.vercel.app'

/**
 * 사이트맵 (사용자 확정 사양 — 검색 노출).
 * 매장 랜딩이 검색에 걸리려면 크롤러가 URL 을 알아야 한다.
 * 공개(published) 매장만 싣고, 로그인이 필요한 화면은 넣지 않는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/heroes', '/market', '/events']
  const entries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${SITE}/${locale}${path}`,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.7,
    })),
  )

  try {
    const stores = await listPublishedStoreIds()
    for (const store of stores) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${SITE}/${locale}/s/${store.id}`,
          lastModified: store.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.9,
        })
      }
    }
  } catch (error) {
    // Firestore 를 못 읽어도 정적 경로만이라도 내보낸다 — 사이트맵 전체가 500 나면 안 된다
    console.error('[sitemap] store list failed:', (error as Error).message)
  }

  return entries
}
