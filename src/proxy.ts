import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

/**
 * Next 16 부터 `middleware` 파일 규약이 `proxy` 로 바뀌었다. 동작은 동일하다.
 *
 * M1 시점에는 i18n 라우팅만 한다.
 * 인증 가드는 M2 에서 여기에 합친다 (docs/03 §5) — 세션 쿠키가 아직 없다.
 * 주의: 이 파일은 Edge 에서 돌아 Admin SDK 를 쓸 수 없다. 쿠키 **존재 여부**만 보고
 * 실제 검증은 서버 컴포넌트에서 한다.
 */
export default createIntlMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
