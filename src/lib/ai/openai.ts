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
  form.append(
    'prompt',
    `Vertical hero portrait of a local small-business owner in Jeju, Korea, for a "${input.category}" shop called "${input.storeName}" (${input.tagline}). ` +
      `Recompose the provided owner photo into a warm editorial photograph: the owner smiling toward camera in their shop, filling the upper two thirds of the frame` +
      (input.menuPhoto
        ? `, holding or presenting their signature item from the second provided photo`
        : '') +
      `. Photorealistic, warm natural light, shallow depth of field, soft cinematic amber color grading, clean background. ` +
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
