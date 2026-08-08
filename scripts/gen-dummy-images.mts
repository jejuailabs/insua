/**
 * 더미 이미지 생성기 (개발 도구 — 앱 런타임 아님)
 *
 *   node scripts/gen-dummy-images.mts            # 없는 것만 생성
 *   node scripts/gen-dummy-images.mts --force    # 전부 다시 생성
 *   node scripts/gen-dummy-images.mts avatars    # 특정 그룹만
 *
 * docs/assets/ref-01~04 의 톤(따뜻한 자연광, 제주 로컬, 사진풍)을 기준으로
 * OpenAI gpt-image-2(quality: low) 로 뽑아 .dummy-images/ 아래에 깐다.
 * OPENAI_API_KEY 는 .env.local 에서 읽는다. 이 키는 앱 코드에서 쓰지 않는다.
 *
 * .dummy-images/ 는 gitignore 된다 — 저장소에도 Vercel 번들에도 들어가지 않는다.
 * 여기서 뽑은 뒤 scripts/upload-dummy-images.mts 로 Firebase Storage 에 올리고,
 * 앱은 src/lib/mock/dummy-images.ts 의 URL 만 참조한다.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_ROOT = join(ROOT, '.dummy-images')

const MODEL = 'gpt-image-2'
const QUALITY = 'low'
const CONCURRENCY = 4

/** 공통 스타일 프리픽스 — 레퍼런스 시안의 룩을 맞춘다. */
const LOOK =
  'Photorealistic editorial photograph, warm natural light, shallow depth of field, ' +
  'soft cinematic color grading with warm amber tones, clean uncluttered background, ' +
  'no text, no logo, no watermark, no lettering anywhere in the image.'

type Size = '1024x1024' | '1024x1536' | '1536x1024'
type Item = { file: string; size: Size; prompt: string }
type Group = { dir: string; items: Item[] }

/** 설계사 CRM 고객 카드 썸네일 (docs/06, ref-03) */
const avatars: Group = {
  dir: 'avatars',
  items: [
    [
      'kim-minsu',
      'Korean man in his late 40s, navy business suit and tie, confident friendly smile, corporate headshot against a soft neutral gray backdrop',
    ],
    [
      'lee-jeongeun',
      'Korean woman in her 30s, white blouse, short bob haircut, warm approachable smile, headshot against a soft neutral backdrop',
    ],
    [
      'park-cheolsu',
      'Korean man in his late 50s, gray hair, dark suit, calm dignified expression, headshot against a soft neutral backdrop',
    ],
    [
      'choi-yujin',
      'Korean woman in her early 30s, long wavy hair, cream blouse, bright confident smile, headshot against a soft neutral backdrop',
    ],
    [
      'jung-haeun',
      'Korean woman in her 40s, shoulder-length hair, light knit top, gentle smile, headshot against a soft neutral backdrop',
    ],
    [
      'kang-donghyun',
      'Korean man in his 30s, glasses, light blue shirt no tie, relaxed smile, headshot against a soft neutral backdrop',
    ],
    [
      'song-mira',
      'Korean woman in her 50s, short permed hair, warm cardigan, kind smile, headshot against a soft neutral backdrop',
    ],
    [
      'yoon-taeho',
      'Korean man in his 20s, casual dark sweater, friendly open expression, headshot against a soft neutral backdrop',
    ],
  ].map(([file, prompt]) => ({
    file: `${file}.webp`,
    size: '1024x1024' as Size,
    prompt: `Head-and-shoulders portrait, subject centered and facing camera. ${prompt}. ${LOOK}`,
  })),
}

/** 소상공인 히어로 카드 (docs/07·08, ref-01·04) — 세로 카드 */
const merchants: Group = {
  dir: 'merchants',
  items: [
    [
      'haenyeo-bapsang',
      'Korean woman in her 60s wearing a brown apron, standing in a cozy traditional Korean seafood restaurant, holding a steaming black stone pot of seafood stew with both hands, proud warm smile',
    ],
    [
      'cafe-oreum',
      'Korean man in his 30s with glasses and a black barista apron, pouring a hand-drip coffee from a gooseneck kettle in a warm wooden specialty cafe, focused gentle expression',
    ],
    [
      'morning-bakery',
      'Korean woman in her 30s in a beige baker apron, holding a wooden tray of freshly baked round bread loaves in a warm bakery, bright happy smile',
    ],
    [
      'sandeul-bbq',
      'Korean man in his 30s in a black chef jacket and cap, standing in a charcoal grill barbecue restaurant, arms relaxed, confident smile',
    ],
    [
      'hair-studio',
      'Korean woman in her 30s hair designer in a black shirt, holding styling scissors up beside her face in a modern hair salon, playful confident smile',
    ],
    [
      'jeju-farmer',
      'Korean man in his 40s wearing a straw hat and work jacket, holding a woven basket of freshly harvested vegetables in a sunlit Jeju field with a volcanic hill in the far background, hearty smile',
    ],
  ].map(([file, prompt]) => ({
    file: `${file}.webp`,
    size: '1024x1536' as Size,
    prompt: `Vertical hero portrait of a local small-business owner in Jeju, Korea. ${prompt}. Subject fills the upper two thirds of the frame, background softly blurred. ${LOOK}`,
  })),
}

/** 마켓 / 메뉴 썸네일 (docs/07·08) — 정사각 카드 */
const products: Group = {
  dir: 'products',
  items: [
    ['jeju-tangerine', 'a woven basket piled with bright orange Jeju tangerines on a wooden table'],
    ['carrot', 'a bundle of fresh carrots with green tops on a rustic wooden surface'],
    ['broccoli', 'fresh green broccoli heads in a wooden bowl'],
    ['potato', 'freshly dug potatoes in a shallow basket with a little soil still on them'],
    [
      'coffee-beans',
      'a kraft paper coffee bean bag standing beside scattered roasted coffee beans, blank unlabeled bag',
    ],
    ['cookie-set', 'a plate of rustic handmade chocolate chip cookies'],
    [
      'latte',
      'a caffe latte with leaf latte art in a white ceramic cup on a saucer, seen from above',
    ],
    ['croissant', 'a pile of golden butter croissants in a bakery basket'],
    ['sweet-bread', 'round Korean sweet red bean buns on a wooden board'],
    [
      'abalone-stew',
      'a bubbling Korean abalone hot pot in a black stone bowl with side dishes around it',
    ],
    ['seaweed-soup', 'a bowl of Korean seaweed soup with sea urchin, served on a wooden tray'],
    ['momguk', 'a bowl of Jeju momguk, Korean pork and seaweed soup in a rustic earthenware bowl on a wooden tray'],
    ['oreum-brew', 'a tall glass of iced black coffee with clear ice on a wooden cafe counter'],
    ['vanilla-latte', 'a vanilla bean latte in a glass mug with visible vanilla specks, side view on a saucer'],
    ['salt-bread', 'golden Korean salt bread rolls glistening with butter on a wooden board'],
    ['pork-neck', 'raw marbled pork neck slices arranged on a dark stone plate for Korean barbecue'],
    ['doenjang-stew', 'a small bubbling Korean soybean paste stew in a stone pot with tofu and zucchini'],
    ['ethiopia-beans', 'an open burlap sack of light roasted coffee beans with a wooden scoop, blank unlabeled sack'],
    ['hair-treatment', 'a minimal unlabeled white squeeze tube of hair treatment on a pale stone surface beside a wooden comb, blank tube with no text'],
    ['black-pork', 'raw marinated Jeju black pork belly slices arranged on a black grill plate'],
    [
      'shampoo',
      'a minimal unlabeled amber pump bottle of shampoo on a pale stone surface with a green leaf, blank bottle with no text',
    ],
    [
      'hair-oil',
      'a small unlabeled glass dropper bottle of hair essence oil on a linen cloth, blank bottle with no text',
    ],
  ].map(([file, prompt]) => ({
    file: `${file}.webp`,
    size: '1024x1024' as Size,
    prompt: `Square product photo for a local marketplace card: ${prompt}. Centered composition, generous margin, soft daylight. ${LOOK}`,
  })),
}

/** 부동산 매매·임대 카드 (docs/07 A-5) — 가로 카드 */
const realty: Group = {
  dir: 'realty',
  items: [
    [
      'storefront-1',
      'an empty small commercial storefront for lease on a quiet Jeju street corner, glass frontage, warm afternoon light',
    ],
    [
      'storefront-2',
      'a two-story commercial building exterior with empty retail space on the ground floor, coastal Korean town street',
    ],
    [
      'storefront-3',
      'a small vacant cafe space exterior with large windows on a tree-lined local street',
    ],
  ].map(([file, prompt]) => ({
    file: `${file}.webp`,
    size: '1536x1024' as Size,
    prompt: `Real-estate listing photo: ${prompt}. Straight-on exterior view, no people, no signage text. ${LOOK}`,
  })),
}

const GROUPS: Record<string, Group> = {
  avatars,
  merchants,
  products,
  realty,
}

// ── 실행 ──────────────────────────────────────────────────────────

function loadApiKey(): string {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) {
    throw new Error('.env.local 이 없다. .env.local.example 을 복사해서 만든다.')
  }
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('OPENAI_API_KEY='))
  const key = line
    ?.slice('OPENAI_API_KEY='.length)
    .trim()
    .replace(/^["']|["']$/g, '')
  if (!key) throw new Error('.env.local 의 OPENAI_API_KEY 가 비어 있다.')
  return key
}

async function generate(key: string, item: Item, outPath: string) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: item.prompt,
      size: item.size,
      quality: QUALITY,
      output_format: 'webp',
      output_compression: 82,
      n: 1,
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`)
  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('응답에 이미지가 없다')
  writeFileSync(outPath, Buffer.from(b64, 'base64'))
  return Buffer.from(b64, 'base64').length
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const only = args.filter((a) => !a.startsWith('--'))
  const key = loadApiKey()

  const jobs: Array<{ group: string; item: Item; outPath: string }> = []
  for (const [name, group] of Object.entries(GROUPS)) {
    if (only.length && !only.includes(name)) continue
    const dir = join(OUT_ROOT, group.dir)
    mkdirSync(dir, { recursive: true })
    for (const item of group.items) {
      const outPath = join(dir, item.file)
      if (!force && existsSync(outPath)) continue
      jobs.push({ group: name, item, outPath })
    }
  }

  if (!jobs.length) {
    console.log('생성할 것이 없다. 다시 뽑으려면 --force.')
    return
  }
  console.log(`${MODEL} / quality=${QUALITY} — ${jobs.length}장 생성 시작\n`)

  let done = 0
  const failed: string[] = []
  const queue = [...jobs]
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (;;) {
        const job = queue.shift()
        if (!job) return
        const label = `${job.group}/${job.item.file}`
        try {
          const bytes = await generate(key, job.item, job.outPath)
          console.log(`  ✓ ${label}  ${Math.round(bytes / 1024)}KB  (${++done}/${jobs.length})`)
        } catch (e) {
          failed.push(label)
          console.error(`  ✗ ${label} — ${(e as Error).message}`)
        }
      }
    }),
  )

  console.log(`\n완료: ${done}/${jobs.length}`)
  if (failed.length) {
    console.log(`실패 ${failed.length}건 — 다시 실행하면 실패한 것만 재시도한다:`)
    failed.forEach((f) => console.log(`  - ${f}`))
    process.exitCode = 1
  }
}

main()
