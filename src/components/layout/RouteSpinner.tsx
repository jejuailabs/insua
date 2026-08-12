/**
 * 세그먼트 로딩 스피너 (사용자 성능 피드백) — 메뉴를 누르는 즉시 이게 뜬다.
 * 서버 렌더가 도는 2~3초 동안 "눌렸다"는 반응이 없던 문제의 답이다.
 *
 * ⚠️ 이걸 `[locale]/loading.tsx` 로 올리지 말 것.
 * locale 전체에 Suspense 경계가 걸리면 응답이 **먼저 스트리밍**되어 상태 코드가 200 으로
 * 굳는다. 그러면 없는 주소도 404 가 아니라 200 으로 나가 검색엔진이 색인해버린다.
 * 실측: 경계가 있으면 `/ko/nope` → 200, 없으면 404.
 * 그래서 경계를 개별 라우트로 내려서 스피너와 정상 404 를 둘 다 지킨다.
 */
export function RouteSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-pill border-3 border-line border-t-accent"
      />
    </div>
  )
}
