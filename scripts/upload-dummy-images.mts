/**
 * 더미 이미지 업로더 (개발 도구 — 앱 런타임 아님)
 *
 *   node scripts/upload-dummy-images.mts            # 안 올라간 것만
 *   node scripts/upload-dummy-images.mts --force    # 전부 다시
 *
 * .dummy-images/ 의 파일을 Firebase Storage `dummy/` 로 올리고,
 * 앱이 참조할 URL 맵을 src/lib/mock/dummy-images.ts 로 떨군다.
 *
 * 이미지는 저장소에도 Vercel 번들에도 넣지 않는다 — 배포 용량을 먹지 않게.
 * 읽기는 다운로드 토큰이 박힌 URL 로 한다. Storage 규칙(`storage.rules`)의
 * 기본 deny 를 건드리지 않고, 토큰 없는 경로 나열도 불가능하다.
 * 쓰기는 Admin SDK(서비스 계정)라 규칙을 우회한다.
 */

import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = join(ROOT, '.dummy-images')
const MANIFEST = join(ROOT, 'src', 'lib', 'mock', 'dummy-images.ts')
const GROUPS = ['avatars', 'merchants', 'products', 'realty'] as const
const PREFIX = 'dummy'

function env(): Record<string, string> {
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) throw new Error('.env.local 이 없다.')
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m) out[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function bucket() {
  const e = env()
  const missing = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].filter(
    (k) => !e[k],
  )
  if (missing.length) throw new Error(`.env.local 에 없다: ${missing.join(', ')}`)

  const app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        credential: cert({
          projectId: e.FIREBASE_PROJECT_ID!,
          clientEmail: e.FIREBASE_CLIENT_EMAIL!,
          privateKey: e.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
        storageBucket: e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
  return getStorage(app).bucket()
}

function downloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}

function camel(name: string) {
  // 숫자 뒤 하이픈(storefront-1)도 식별자가 되도록 하이픈은 전부 삼킨다.
  return name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

async function main() {
  const force = process.argv.includes('--force')
  if (!existsSync(SRC_ROOT)) {
    throw new Error('.dummy-images/ 가 없다. 먼저 node scripts/gen-dummy-images.mts 를 돌린다.')
  }

  const b = bucket()
  const [exists] = await b.exists()
  if (!exists) {
    throw new Error(
      `Storage 버킷 ${b.name} 이 없다. Firebase 콘솔 → Storage 에서 먼저 시작해야 한다.`,
    )
  }

  const urls: Record<string, Record<string, string>> = {}
  let uploaded = 0
  let reused = 0

  for (const group of GROUPS) {
    const dir = join(SRC_ROOT, group)
    if (!existsSync(dir)) continue
    urls[group] = {}

    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith('.webp'))
      .sort()) {
      const key = camel(file.replace(/\.webp$/, ''))
      const path = `${PREFIX}/${group}/${file}`
      const obj = b.file(path)

      let token: string | undefined
      if (!force) {
        const [found] = await obj.exists()
        if (found) {
          const [meta] = await obj.getMetadata()
          token = (meta.metadata?.firebaseStorageDownloadTokens as string | undefined)?.split(
            ',',
          )[0]
          if (token) reused++
        }
      }

      if (!token) {
        token = randomUUID()
        await obj.save(readFileSync(join(dir, file)), {
          resumable: false,
          contentType: 'image/webp',
          metadata: {
            // 더미는 바뀌어도 파일명이 같으니 캐시를 길게 잡는다.
            cacheControl: 'public, max-age=31536000, immutable',
            metadata: { firebaseStorageDownloadTokens: token },
          },
        })
        uploaded++
        console.log(`  ↑ ${path}`)
      }

      urls[group]![key] = downloadUrl(b.name, path, token)
    }
  }

  const body = GROUPS.filter((g) => urls[g] && Object.keys(urls[g]!).length)
    .map((g) => {
      const entries = Object.entries(urls[g]!)
        .map(([k, v]) => `  ${k}: '${v}',`)
        .join('\n')
      return `export const ${g} = {\n${entries}\n} as const\n\nexport type ${camel(g[0]!.toUpperCase() + g.slice(1))}Key = keyof typeof ${g}\n`
    })
    .join('\n')

  writeFileSync(
    MANIFEST,
    `// 자동 생성 파일 — 직접 고치지 말 것.\n` +
      `// scripts/upload-dummy-images.mts 가 Firebase Storage 업로드 후 다시 쓴다.\n` +
      `//\n` +
      `// 개발용 더미 이미지 URL. 실제 콘텐츠가 아니고 실인물도 아니다 (gpt-image-2 생성물).\n` +
      `// 이미지 실물은 저장소에 없다 — Vercel 번들 용량을 먹지 않게 Storage 에만 둔다.\n\n` +
      body,
    'utf8',
  )

  console.log(`\n업로드 ${uploaded}건 / 기존 재사용 ${reused}건`)
  console.log(`맵 갱신: src/lib/mock/dummy-images.ts`)
}

main().catch((e) => {
  console.error(`✗ ${(e as Error).message}`)
  process.exitCode = 1
})
