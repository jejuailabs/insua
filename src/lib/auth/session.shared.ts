/**
 * 서버·Edge 양쪽에서 쓰는 상수만 둔다.
 *
 * `session.ts` 는 `server-only` 인 Admin SDK 를 끌고 오기 때문에 proxy(Edge)에서 import 할 수 없다.
 * 쿠키 이름 하나 때문에 그걸 통째로 들여올 수는 없어서 분리했다.
 */
export const SESSION_COOKIE = '__session'
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000 // 5일
