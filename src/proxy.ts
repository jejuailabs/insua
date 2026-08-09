import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/session.shared'
import { routing } from '@/lib/i18n/routing'

/**
 * Next 16 부터 `middleware` 파일 규약이 `proxy` 로 바뀌었다. 동작은 동일하다.
 *
 * **여기는 3중 방어의 1층일 뿐이다** (docs/03 §4.3).
 * Edge 에서 돌아 Admin SDK 를 못 쓰므로 **쿠키 존재 여부만** 본다.
 * 쿠키가 위조됐는지, 역할이 맞는지는 2층(서버 컴포넌트)과 3층(Security Rules)이 판정한다.
 * 여기서 통과했다는 게 인증됐다는 뜻이 아니다.
 */
const intl = createIntlMiddleware(routing)

/** locale 접두사를 뗀 경로 기준. 하위 경로까지 포함해서 막는다. */
const PROTECTED = ['/crm', '/home', '/store', '/feed', '/admin', '/onboarding'] as const

/** ['', 'ko', 'crm', ...] — 두 번째 조각이 알려진 locale 이면 떼어낸다. */
function splitLocale(pathname: string): { locale: string; path: string } {
  const segments = pathname.split('/')
  const maybeLocale = segments[1]
  if (maybeLocale && (routing.locales as readonly string[]).includes(maybeLocale)) {
    return { locale: maybeLocale, path: '/' + segments.slice(2).join('/') }
  }
  return { locale: routing.defaultLocale, path: pathname }
}

function needsAuth(path: string): boolean {
  // startsWith 만 쓰면 '/home' 이 '/homepage' 까지 잡는다. 경계를 명시한다.
  return PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale, path } = splitLocale(pathname)

  if (needsAuth(path) && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone()
    // 로그인 전용 화면은 없다 — 메인으로 보내고 로그인 **모달**을 연다 (login=1).
    // 요청한 locale 을 유지한다. 기본 locale 로 보내면 영어 사용자가 한국어 화면으로 튕긴다.
    url.pathname = `/${locale}`
    url.search = ''
    url.searchParams.set('login', '1')
    return NextResponse.redirect(url)
  }

  return intl(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
