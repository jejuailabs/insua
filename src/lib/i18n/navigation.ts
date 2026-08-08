import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * locale 을 자동으로 붙여주는 네비게이션 API.
 * 화면 코드는 next/link 대신 여기의 Link 를 쓴다. 안 그러면 언어 전환 시 경로가 깨진다.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
