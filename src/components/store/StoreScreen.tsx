'use client'

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  MapPin,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Composer, type DraftPost } from './Composer'
import { StoreHeroCard } from './StoreHeroCard'
import { MENU_SECTION_KEY, type ModuleId, type Store } from '@/lib/mock/store'
import { cn } from '@/lib/utils/cn'

type ModuleState = { id: ModuleId; visible: boolean }
type Post = DraftPost & { id: number; minutesAgo: number }

/**
 * 내 매장 화면 (ref-01, docs/07 B).
 * - 모듈 수정: 섹션 순서(↑↓)·표시/숨김 토글 → stores.modules 로 저장될 상태 (지금은 클라이언트)
 * - 컴포저: 텍스트·사진·익명 게시 → 소식 섹션에 즉시 반영
 * - 편집 화면과 공개 화면(/s/[id])은 같은 데이터를 다른 컴포넌트가 렌더한다 (B 원칙)
 */
export function StoreScreen({ stores }: { stores: Store[] }) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()

  const [index, setIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const [modules, setModules] = useState<ModuleState[]>([
    { id: 'menu', visible: true },
    { id: 'about', visible: true },
    { id: 'news', visible: true },
  ])
  const [posts, setPosts] = useState<Post[]>([])

  const store = stores[index]!

  function move(id: ModuleId, delta: -1 | 1) {
    setModules((list) => {
      const i = list.findIndex((m) => m.id === id)
      const j = i + delta
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i]!, next[j]!] = [next[j]!, next[i]!]
      return next
    })
  }

  function toggle(id: ModuleId) {
    setModules((list) => list.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)))
  }

  function addPost(draft: DraftPost) {
    setPosts((list) => [{ ...draft, id: Date.now(), minutesAgo: 0 }, ...list])
  }

  const sectionTitle: Record<ModuleId, string> = {
    menu: t(MENU_SECTION_KEY[store.category]),
    about: t('merchant.storeIntro'),
    news: t('merchant.news'),
  }

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-2 pb-56">
        <header className="relative flex min-h-11 items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/home`)}
            aria-label={t('nav.home')}
            className="grid h-10 w-10 place-items-center text-content"
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-subtitle text-content">
            {t('merchant.myStore')}
          </h1>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(
              'rounded-chip px-3 py-1.5 text-label',
              editing ? 'bg-accent-strong text-accent-on' : 'bg-surface-2 text-content',
            )}
          >
            {editing ? t('common.save') : t('merchant.editModules')}
          </button>
        </header>

        <div className="mt-3">
          <StoreHeroCard
            stores={stores}
            index={index}
            onIndexChange={setIndex}
            onDetail={(s) => router.push(`/${locale}/s/${s.id}`)}
          />
        </div>

        {modules.map((mod) => {
          if (!mod.visible && !editing) return null
          return (
            <section key={mod.id} className={cn('mt-6', !mod.visible && 'opacity-40')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editing && <GripVertical size={16} aria-hidden className="text-content-faint" />}
                  <h2 className="text-subtitle text-content">{sectionTitle[mod.id]}</h2>
                </div>

                {editing ? (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(mod.id, -1)}
                      aria-label={t('merchant.moveUp')}
                      className="grid h-8 w-8 place-items-center rounded-chip bg-surface-2 text-content-muted"
                    >
                      <ArrowUp size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(mod.id, 1)}
                      aria-label={t('merchant.moveDown')}
                      className="grid h-8 w-8 place-items-center rounded-chip bg-surface-2 text-content-muted"
                    >
                      <ArrowDown size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(mod.id)}
                      aria-label={t('merchant.toggleVisibility')}
                      aria-pressed={!mod.visible}
                      className="grid h-8 w-8 place-items-center rounded-chip bg-surface-2 text-content-muted"
                    >
                      {mod.visible ? (
                        <Eye size={15} aria-hidden />
                      ) : (
                        <EyeOff size={15} aria-hidden />
                      )}
                    </button>
                  </span>
                ) : (
                  mod.id === 'menu' && (
                    <span className="flex items-center gap-0.5 text-caption text-content-muted">
                      {t('common.more')}
                      <ChevronRight size={14} aria-hidden />
                    </span>
                  )
                )}
              </div>

              {mod.id === 'menu' && <MenuGrid store={store} />}
              {mod.id === 'about' && <AboutSection store={store} />}
              {mod.id === 'news' && <NewsList posts={posts} />}
            </section>
          )
        })}
      </main>

      <Composer onPost={addPost} />
    </>
  )
}

function MenuGrid({ store }: { store: Store }) {
  const t = useTranslations('format')
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2">
      {store.menus.map((menu) => (
        <li key={menu.id} className="overflow-hidden rounded-inner border border-line bg-surface">
          <div className="relative aspect-square">
            <Image src={menu.image} alt="" fill sizes="33vw" className="object-cover" />
          </div>
          <div className="p-2">
            <p className="truncate text-label text-content">{menu.name}</p>
            <p className="tabular mt-0.5 text-label text-content">
              {t('currency', { amount: menu.price.toLocaleString() })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function AboutSection({ store }: { store: Store }) {
  const t = useTranslations('merchant')
  return (
    <div className="mt-3 flex gap-3">
      <p className="flex-1 text-body whitespace-pre-line text-content">{store.intro}</p>
      {/* 지도 SDK 미확정 (docs/01) — MapPlaceholder */}
      <div className="grid aspect-[4/3] w-32 shrink-0 place-items-center rounded-inner border border-line bg-surface-2">
        <span className="flex flex-col items-center gap-1 text-content-muted">
          <MapPin size={20} aria-hidden className="text-accent-strong" />
          <span className="text-micro">{t('viewMap')}</span>
        </span>
      </div>
    </div>
  )
}

function NewsList({ posts }: { posts: Post[] }) {
  const t = useTranslations()
  if (!posts.length) {
    // 제품 철학 문구 그대로 (docs/07 B-7). 바꾸지 말 것.
    return <p className="mt-3 text-caption text-content-muted">{t('merchant.composerHint')}</p>
  }
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {posts.map((post) => (
        <li key={post.id} className="rounded-inner border border-line bg-surface p-3">
          {post.imageUrl && (
            <div className="relative mb-2 aspect-[2/1] overflow-hidden rounded-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          {post.text && <p className="text-body text-content">{post.text}</p>}
          <p className="mt-1.5 text-micro text-content-muted">
            {post.anonymous ? t('anonymous.author') : t('merchant.myStore')} ·{' '}
            {t('common.minutesAgo', { n: post.minutesAgo })}
          </p>
        </li>
      ))}
    </ul>
  )
}
