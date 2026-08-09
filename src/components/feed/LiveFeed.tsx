import { Radio, Store, UsersRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import type { FeedPost } from '@/lib/feed/data'

/**
 * 실시간 로컬 피드 (사용자 확정 사양) — 메인 직거래 섹션 아래.
 * 설계사·소상공인이 올린 소식이 SNS 형식으로 흐른다. 소비자에게는 읽기 전용.
 */
export async function LiveFeed({ posts }: { posts: FeedPost[] }) {
  const t = await getTranslations()
  if (!posts.length) return null

  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-1.5 text-subtitle text-content">
        <Radio size={16} aria-hidden className="text-accent-strong" />
        {t('feed.liveSection')}
      </h2>

      <ul className="mt-3 flex flex-col gap-3">
        {posts.map((post) => {
          const RoleIcon = post.authorRole === 'agent' ? UsersRound : Store
          const card = (
            <article className="rounded-card border border-line bg-surface p-3">
              <p className="flex items-center gap-1.5 text-label text-content">
                <span className="grid h-7 w-7 place-items-center rounded-pill bg-accent-soft text-accent-strong">
                  <RoleIcon size={13} aria-hidden />
                </span>
                {post.authorName}
                <span className="tabular ml-auto text-micro text-content-muted">
                  {post.minutesAgo >= 60
                    ? t('common.hoursAgo', { n: Math.floor(post.minutesAgo / 60) })
                    : t('common.minutesAgo', { n: post.minutesAgo })}
                </span>
              </p>

              {post.imageURL && (
                <div className="relative mt-2 aspect-[2/1] overflow-hidden rounded-inner">
                  <Image
                    src={post.imageURL}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, 420px"
                    className="object-cover"
                  />
                </div>
              )}

              {post.body && <p className="mt-2 text-body text-content">{post.body}</p>}
            </article>
          )

          return (
            <li key={post.id}>
              {post.storeId ? <Link href={`/s/${post.storeId}`}>{card}</Link> : card}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
