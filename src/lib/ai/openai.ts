import 'server-only'

/**
 * OpenAI 실호출 (서버 전용).
 *
 * docs/10 은 원래 "실호출 없음"이었으나 사용자 지시로 실구현으로 전환했다 (2026-08-09).
 * 화면 코드는 여전히 이 모듈을 직접 부르지 않는다 — 서버 액션만 거친다.
 * 키는 OPENAI_API_KEY (Vercel 환경변수 등록됨). 클라이언트에 절대 노출 금지.
 */

const IMAGE_MODEL = 'gpt-image-2'
const CHAT_MODEL = 'gpt-4.1-mini'
const STT_MODEL = 'gpt-4o-mini-transcribe'

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY_MISSING')
  return key
}

export function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/**
 * 히어로 이미지 생성 — 사장님 사진(+메뉴 사진)을 입력으로 ref-01~04 톤의
 * 세로 히어로 컷 하나를 합성한다. quality: low (사용자 지정 사양).
 */
export async function generateHeroImage(input: {
  ownerPhoto: { data: Buffer; mime: string }
  menuPhoto?: { data: Buffer; mime: string } | null
  storeName: string
  tagline: string
  category: string
}): Promise<Buffer> {
  const form = new FormData()
  form.append('model', IMAGE_MODEL)
  form.append('quality', 'low')
  form.append('size', '1024x1536')
  form.append('output_format', 'webp')
  // 사장 얼굴과 대표 메뉴가 화면을 지배해야 한다 (사용자 확정 사양) —
  // 얼굴은 밝고 신뢰가는 미소로 또렷하게, 메뉴는 전경에 크게.
  form.append(
    'prompt',
    `Vertical hero portrait for a local "${input.category}" shop called "${input.storeName}" (${input.tagline}) in Jeju, Korea. ` +
      `THE TWO DOMINANT SUBJECTS: (1) the owner's face from the first provided photo — bright, warm, trustworthy smile, ` +
      `looking straight at the camera, face large, sharp and well-lit in the upper half of the frame; ` +
      (input.menuPhoto
        ? `(2) the signature dish from the second provided photo — held proudly in the foreground at chest level, large, appetizing, in crisp focus. `
        : `(2) their signature product presented proudly in the foreground, large and in crisp focus. `) +
      `Waist-up composition, the face and the dish together fill most of the frame. ` +
      `Background: their shop interior, softly blurred, warm natural light, cinematic amber grading. ` +
      `Keep the owner's identity faithful to the photo. Photorealistic. ` +
      `No text, no logo, no watermark, no lettering anywhere in the image.`,
  )
  form.append(
    'image[]',
    new Blob([new Uint8Array(input.ownerPhoto.data)], { type: input.ownerPhoto.mime }),
    'owner.png',
  )
  if (input.menuPhoto) {
    form.append(
      'image[]',
      new Blob([new Uint8Array(input.menuPhoto.data)], { type: input.menuPhoto.mime }),
      'menu.png',
    )
  }

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  })
  if (!res.ok) throw new Error(`IMAGE_GEN_FAILED ${res.status} ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('IMAGE_GEN_EMPTY')
  return Buffer.from(b64, 'base64')
}

/** 음성 상담 STT. */
export async function transcribeAudio(audio: { data: Buffer; mime: string }): Promise<string> {
  const form = new FormData()
  form.append('model', STT_MODEL)
  form.append('language', 'ko')
  form.append(
    'file',
    new Blob([new Uint8Array(audio.data)], { type: audio.mime }),
    audio.mime.includes('mp4') ? 'audio.mp4' : 'audio.webm',
  )

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  })
  if (!res.ok) throw new Error(`STT_FAILED ${res.status} ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  return (json.text as string) ?? ''
}

/** 채팅 완성 — RAG 챗봇·상담 정리 공용. */
export async function chatComplete(
  system: string,
  user: string,
  maxTokens = 1200,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`CHAT_FAILED ${res.status} ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content as string) ?? ''
}

/**
 * 매장 랜딩 SEO/AEO/GEO 카피 생성 (사용자 확정 사양).
 *
 * 세 가지를 한 번에 노린다:
 * - **SEO** — 검색엔진. 메타 제목/설명을 글자수 규격에 맞추고 핵심 키워드 2~3개 + 롱테일을 심는다.
 * - **AEO** — 답변엔진(AI 요약). 질문 그대로의 FAQ 와 단답 가능한 사실 문장을 만든다.
 * - **GEO** — 생성엔진 인용. 상호·지역·업종을 매 문단에서 명시해 인용해도 주어가 살아 있게 한다.
 *
 * 모델이 만든 문장은 그대로 발행되므로, 없는 사실(수상·연혁·원산지)을 지어내지 못하게 못박는다.
 */
export type StoreSeoCopy = {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  longTailKeywords: string[]
  headline: string
  subheadline: string
  sections: Array<{ heading: string; body: string }>
  faq: Array<{ q: string; a: string }>
  highlights: string[]
}

export async function generateStoreSeoCopy(input: {
  storeName: string
  category: string
  subCategory?: string
  address: string
  tagline: string
  menuName: string
  menuPrice: number
  hours: { open: string; close: string }
  ownerNote?: string
}): Promise<StoreSeoCopy> {
  const system = [
    '너는 로컬 소상공인 매장 페이지를 담당하는 한국어 SEO 카피라이터다.',
    '검색엔진(SEO)·AI 답변엔진(AEO)·생성엔진 인용(GEO)에 모두 걸리는 글을 쓴다.',
    '',
    '규칙:',
    '1. 주어진 사실만 쓴다. 수상 이력·창업 연도·원산지·인증 등 주어지지 않은 정보를 지어내지 않는다.',
    '2. 상호와 지역명(주소의 시/구/동)을 자연스럽게 반복해 노출한다. 문단마다 주어가 분명해야 한다.',
    '3. metaTitle 은 25~35자, metaDescription 은 70~90자로 맞춘다(공백 포함, 한국어 기준).',
    '4. keywords 는 실제 검색어 형태의 핵심 2~3개(예: "제주 흑돼지 맛집").',
    '   longTailKeywords 는 4~5개의 구체적 롱테일(예: "제주시 연동 흑돼지 오겹살 저녁 예약").',
    '5. sections 는 3개. heading 은 15자 내외 소제목, body 는 120~200자 서술형 문장(개조식 금지).',
    '6. faq 는 4개. q 는 손님이 검색창에 그대로 칠 법한 질문, a 는 60~120자 단답형 사실 문장.',
    '7. highlights 는 5개, 각 20자 이내의 사실 조각(영업시간·대표메뉴·위치 등).',
    '8. 과장 광고 표현("최고", "1위", "전국 최대")과 이모지를 쓰지 않는다.',
    '',
    'JSON 만 출력한다. 키: metaTitle, metaDescription, keywords, longTailKeywords, headline, subheadline, sections, faq, highlights',
  ].join('\n')

  const user = JSON.stringify(input, null, 2)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`SEO_FAILED ${res.status} ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  const raw = JSON.parse((json.choices?.[0]?.message?.content as string) ?? '{}')

  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback)
  const list = (v: unknown, n: number) =>
    Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, n) : []

  return {
    metaTitle: str(raw.metaTitle, input.storeName),
    metaDescription: str(raw.metaDescription, input.tagline),
    keywords: list(raw.keywords, 3),
    longTailKeywords: list(raw.longTailKeywords, 5),
    headline: str(raw.headline, input.storeName),
    subheadline: str(raw.subheadline, input.tagline),
    sections: Array.isArray(raw.sections)
      ? raw.sections
          .filter((s: unknown): s is { heading: string; body: string } => {
            const o = s as { heading?: unknown; body?: unknown }
            return typeof o?.heading === 'string' && typeof o?.body === 'string'
          })
          .slice(0, 3)
          .map((s: { heading: string; body: string }) => ({
            heading: s.heading.trim(),
            body: s.body.trim(),
          }))
      : [],
    faq: Array.isArray(raw.faq)
      ? raw.faq
          .filter((f: unknown): f is { q: string; a: string } => {
            const o = f as { q?: unknown; a?: unknown }
            return typeof o?.q === 'string' && typeof o?.a === 'string'
          })
          .slice(0, 4)
          .map((f: { q: string; a: string }) => ({ q: f.q.trim(), a: f.a.trim() }))
      : [],
    highlights: list(raw.highlights, 5),
  }
}
