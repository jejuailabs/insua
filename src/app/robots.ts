import type { MetadataRoute } from 'next'

/**
 * robots (사용자 확정 사양 — 검색 노출).
 * 공개 랜딩·목록은 열고, 로그인·개인 데이터가 있는 경로는 막는다.
 * AI 답변엔진 크롤러도 같은 규칙을 따른다 — 별도 차단은 두지 않는다(AEO/GEO 목적).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/*/admin', '/*/crm', '/*/me', '/*/saved', '/*/onboarding', '/*/login'],
    },
    sitemap: 'https://insua.vercel.app/sitemap.xml',
  }
}
