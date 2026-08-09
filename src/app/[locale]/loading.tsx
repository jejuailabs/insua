/**
 * 세그먼트 로딩 상태 (사용자 성능 피드백) — 메뉴를 누르는 즉시 이게 뜬다.
 * 서버 렌더가 도는 2~3초 동안 "눌렸다"는 반응이 없던 문제의 답이다.
 */
export default function LocaleLoading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-pill border-3 border-line border-t-accent"
      />
    </div>
  )
}
