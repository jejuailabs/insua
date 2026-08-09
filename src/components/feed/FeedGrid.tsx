'use client'

import { Radio, Store, UsersRound } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { loadFeedPage } from '@/lib/feed/actions'
import type { FeedPost } from '@/lib/feed/data'
import { cn } from '@/lib/utils/cn'

/**
 * 실시간 로컬 피드 — SNS 그리드 (사용자 확정 사양).
 * 한 줄 3개, 스크롤이 끝에 닿으면 다음 페이지를 계속 불러온다(무한 스크롤).
 * 사진을 누르면 모달로 원본 + 매장·텍스트 정보가 뜬다.
 */
export function FeedGrid({ initialPosts }: { initialPosts: FeedPost[] }) {
  const t = useTranslations()
  const locale = useLocale()
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [selected, setSelected] = useState<FeedPost | null>(null)
  const [done, setDone] = useState(initialPosts.length < 12)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || done) return
    // offset 은 현재 개수 — 서버가 최신순으로 잘라 내려준다
    const loadMore = () => {
      if (loadingRef.current) return
      loadingRef.current = true
      setPosts((current) => {
        void loadFeedPage(current.length, 9)
          .then((next) => {
            if (next.length === 0) setDone(true)
            else
              setPosts((prev) => [...prev, ...next.filter((p) => !prev.some((x) => x.id === p.id))])
          })
          .finally(() => {
            loadingRef.current = false
          })
        return current
      })
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    })
    observer.observe(sentinel)
    // 렌더 루프가 멈춘 웹뷰(숨김 탭 등) 폴백 — 스크롤로 센티널 근접을 직접 검사
    const onScroll = () => {
      if (sentinel.getBoundingClientRect().top < window.innerHeight + 160) loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [done])

  if (!posts.length) return null

  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-1.5 text-subtitle text-content">
        <Radio size={16} aria-hidden className="text-accent-strong" />
        {t('feed.liveSection')}
      </h2>

      {/* SNS 그리드 — 한 줄 3개 */}
      <ul className="mt-3 grid grid-cols-3 gap-1.5">
        {posts.map((post) => {
          const RoleIcon = post.authorRole === 'agent' ? UsersRound : Store
          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => setSelected(post)}
                className="relative block aspect-square w-full overflow-hidden rounded-inner border border-line bg-surface"
              >
                {post.imageURL ? (
                  <Image
                    src={post.imageURL}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 33vw, 200px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center p-2">
                    <span className="line-clamp-4 text-caption text-content">{post.body}</span>
                  </span>
                )}
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-pill bg-black/55 px-1.5 py-0.5 text-micro text-white">
                  <RoleIcon size={9} aria-hidden />
                  <span className="max-w-20 truncate">{post.authorName}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* 무한 스크롤 센티널 */}
      {!done && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span
            aria-hidden
            className="h-5 w-5 animate-spin rounded-pill border-2 border-line border-t-accent"
          />
        </div>
      )}

      {/* SNS 상세 모달 */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.authorName ?? ''}
        description={
          selected
            ? selected.minutesAgo >= 60
              ? t('common.hoursAgo', { n: Math.floor(selected.minutesAgo / 60) })
              : t('common.minutesAgo', { n: selected.minutesAgo })
            : undefined
        }
      >
        {selected && (
          <div className="flex flex-col gap-3">
            {selected.imageURL && (
              <div className="relative aspect-square overflow-hidden rounded-inner">
                <Image
                  src={selected.imageURL}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 420px"
                  className="object-cover"
                />
              </div>
            )}
            {selected.body && <p className="text-body text-content">{selected.body}</p>}
            {selected.storeId && (
              <Link
                href={`/${locale}/s/${selected.storeId}`}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-chip',
                  'bg-accent-strong text-label text-accent-on',
                )}
              >
                <Store size={16} aria-hidden />
                {t('merchant.viewDetail')}
              </Link>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
