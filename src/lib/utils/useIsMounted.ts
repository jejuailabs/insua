'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * 하이드레이션이 끝났는지 알려준다. 서버/첫 렌더에서는 false, 그 뒤로 true.
 *
 * 테마·팔레트처럼 **서버가 알 수 없는 값**에 따라 활성 상태를 그려야 할 때 쓴다.
 * 그냥 그리면 서버 HTML 과 달라져 하이드레이션이 어긋난다 (docs/04 §6.3).
 *
 * `useState(false)` + `useEffect(() => setMounted(true))` 로도 되지만,
 * 그 패턴은 렌더를 한 번 더 유발하고 react-hooks/set-state-in-effect 에 걸린다.
 */
export function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
