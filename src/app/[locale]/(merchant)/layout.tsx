/**
 * 소상공인 공간은 **모바일 전용 스테이지**다 (사용자 확정 사양).
 * 데스크톱에서도 폰 폭(max-w-md)의 세로 프레임 안에서만 렌더된다 —
 * ref-01·02 시안이 전부 모바일 프레임이고, 업주 사용 맥락도 매장에서 폰이다.
 * 하단 고정 바(탭바·컴포저)도 같은 폭으로 잘려 프레임 밖으로 새지 않는다.
 */
export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:bg-surface-2">
      <div className="relative mx-auto min-h-dvh w-full max-w-md bg-bg lg:max-w-2xl lg:border-x lg:border-line lg:shadow-card">
        {children}
      </div>
    </div>
  )
}
