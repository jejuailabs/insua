'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadToStorage } from '@/lib/stores/data'
import { AI_TOOLS, DEFAULT_MENU_TEMPLATES, listMenuTemplates, type AiToolId } from './tools'

type ToolResult =
  | { ok: true; resultURL: string; jobId: string }
  | { ok: false; code: 'INVALID' | 'FORBIDDEN' | 'FAILED' }

async function requireToolUser() {
  const session = await requireSession()
  // 소상공인 도구지만 설계사·관리자도 쓴다 (설계사가 대신 만들어주는 흐름).
  if (!session.role && !session.isAdmin) throw new Error('FORBIDDEN')
  return session
}

async function fileBuffer(form: FormData, key: string) {
  const file = form.get(key) as File | null
  if (!file || file.size === 0) return null
  return { data: Buffer.from(await file.arrayBuffer()), mime: file.type || 'image/jpeg' }
}

/** 저장된 URL(이전 결과)을 AI 입력으로 재사용 — 피팅룸 2단계용. */
async function urlBuffer(url: string | null) {
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com/')) return null
  const res = await fetch(url)
  if (!res.ok) return null
  return {
    data: Buffer.from(await res.arrayBuffer()),
    mime: res.headers.get('content-type') ?? 'image/webp',
  }
}

/**
 * AI Tools 공용 실행기 (사용자 확정 사양).
 * form: tool, step, image1(파일)|baseUrl(이전 결과), image2(파일, 선택), 옵션 필드.
 * 결과는 aiJobs 에 자동 저장 — 저장 버튼 없이도 히스토리에 남는다.
 */
export async function runAiTool(form: FormData): Promise<ToolResult> {
  const tool = String(form.get('tool') ?? '') as AiToolId
  if (!AI_TOOLS.includes(tool)) return { ok: false, code: 'INVALID' }

  try {
    const session = await requireToolUser()
    const uid = session.uid

    const image1 =
      (await fileBuffer(form, 'image1')) ?? (await urlBuffer(form.get('baseUrl') as string | null))
    const image2 = await fileBuffer(form, 'image2')
    if (!image1) return { ok: false, code: 'INVALID' }

    let step = 'main'
    let size: '1024x1024' | '1024x1536' = '1024x1536'
    let prompt = ''

    if (tool === 'menu-poster') {
      // 20년차 메뉴 포스터 디자이너 (사용자 확정 사양) — 템플릿 스타일 결합
      const templateId = String(form.get('templateId') ?? '')
      const templates = await listMenuTemplates()
      const template = templates.find((t) => t.id === templateId) ?? DEFAULT_MENU_TEMPLATES[0]!
      const menuName = String(form.get('menuName') ?? '').trim()
      const price = String(form.get('price') ?? '').trim()
      step = template.id
      // 원본 충실성 원칙 — 음식 사진은 "포토샵 보정" 수준까지만 (허위·과장 광고 방지)
      prompt =
        `A beautiful printable menu poster designed by a food-branding designer with 20 years of experience, for a small local shop. ` +
        `Use the provided dish photo as the hero image. ` +
        `Photo integrity rule — retouch the dish photo only as a professional photo editor would: ` +
        `exposure, white balance, color vibrance, contrast, sharpness, and cleaning up background clutter. ` +
        `Never add, remove, enlarge or replace any food, ingredient, garnish or tableware, and never change the portion size or plating — ` +
        `the dish must stay truthful to what customers are actually served. ` +
        `All creative decoration (frames, patterns, illustrations, typography) goes around the photo, never inside the dish itself. ` +
        `Style: ${template.style}. Vertical poster composition with tasteful typography hierarchy. ` +
        (menuName
          ? `The poster prominently features the menu name "${menuName}"${price ? ` and the price "${price}원"` : ''} in Korean. `
          : 'No readable text on the poster. ') +
        `High-end design a shop owner would proudly hang on their wall.`
    } else if (tool === 'fitting') {
      const stage = String(form.get('stage') ?? 'studio')
      const sizeLabel = String(form.get('sizeLabel') ?? '').trim()
      if (stage === 'studio') {
        // 1단계 — 스튜디오 인물 가공 (+ 사이즈 반영)
        step = 'studio'
        prompt =
          `Transform the provided person photo into a professional studio portrait: seamless light-gray studio backdrop, ` +
          `soft key lighting, natural skin tones, full or three-quarter body framing suitable for trying on clothes. ` +
          (sizeLabel
            ? `Depict the body proportions matching Korean apparel size "${sizeLabel}". `
            : '') +
          `Keep the person's identity, face and hairstyle faithful to the original. Photorealistic, no text.`
      } else {
        // 2단계 — 옷 착장 (base: 1단계 결과, image2: 옷)
        if (!image2) return { ok: false, code: 'INVALID' }
        step = 'wear'
        prompt =
          `Virtual fitting: dress the person from the first image in the clothing item shown in the second image. ` +
          `Natural fabric drape, correct fit and proportions, keep the studio backdrop, lighting, pose and the person's identity unchanged. ` +
          `Photorealistic, no text.`
      }
    } else if (tool === 'nail') {
      // 손 사진 + 네일 디자인 → 가상 네일룸
      if (!image2) return { ok: false, code: 'INVALID' }
      step = 'nail'
      size = '1024x1024'
      prompt =
        `Virtual nail salon: apply the nail design from the second image onto the fingernails of the hand in the first image. ` +
        `Precise application on each visible nail, glossy salon finish, keep the hand's skin tone, pose and background unchanged. ` +
        `Close-up beauty photography, photorealistic, no text.`
    } else {
      // 펫 스튜디오 — 20년차 반려동물 사진작가 (+ 선택 악세사리 착장)
      step = image2 ? 'wear' : 'studio'
      prompt =
        `A premium pet studio photograph taken by a pet photographer with 20 years of experience, of the pet in the provided photo. ` +
        `Seamless pastel studio backdrop, soft flattering lighting, sharp focus on the eyes, charming expression, keep the pet's breed, fur pattern and identity faithful. ` +
        (image2
          ? `The pet is wearing the accessory or apparel shown in the second image, fitted naturally and comfortably. `
          : '') +
        `Photorealistic, heartwarming, no text.`
    }

    // gpt-image-2 (low) 호출 — edits 엔드포인트에 입력 이미지를 그대로 넘긴다
    const apiForm = new FormData()
    apiForm.append('model', 'gpt-image-2')
    apiForm.append('quality', 'low')
    apiForm.append('size', size)
    apiForm.append('output_format', 'webp')
    apiForm.append('prompt', prompt)
    apiForm.append(
      'image[]',
      new Blob([new Uint8Array(image1.data)], { type: image1.mime }),
      'input1.png',
    )
    if (image2) {
      apiForm.append(
        'image[]',
        new Blob([new Uint8Array(image2.data)], { type: image2.mime }),
        'input2.png',
      )
    }

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: apiForm,
    })
    if (!res.ok) {
      console.error('[ai-tools] generation failed:', res.status, (await res.text()).slice(0, 200))
      return { ok: false, code: 'FAILED' }
    }
    const json = await res.json()
    const b64 = json.data?.[0]?.b64_json
    if (!b64) return { ok: false, code: 'FAILED' }

    const jobRef = getAdminDb().collection('aiJobs').doc()
    const resultURL = await uploadToStorage(
      `ai/${uid}/${tool}/${jobRef.id}.webp`,
      Buffer.from(b64, 'base64'),
      'image/webp',
    )

    // 자동 저장 — 저장 버튼과 무관하게 내역이 남는다 (사용자 확정 사양)
    await jobRef.set({
      uid,
      tool,
      step,
      resultURL,
      aiGenerated: true, // docs/10 §7
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')
    return { ok: true, resultURL, jobId: jobRef.id }
  } catch (error) {
    console.error('[ai-tools] runAiTool failed:', (error as Error).message)
    return { ok: false, code: 'FAILED' }
  }
}

/** 메뉴 포스터 템플릿 추가 — 관리자 전용 (사용자 확정 사양). */
export async function addMenuTemplate(name: string, style: string): Promise<{ ok: boolean }> {
  const session = await requireSession()
  if (!session.isAdmin) return { ok: false }
  const trimmedName = name?.trim()
  const trimmedStyle = style?.trim()
  if (!trimmedName || !trimmedStyle) return { ok: false }

  await getAdminDb().collection('aiTemplates').add({
    tool: 'menu-poster',
    name: trimmedName,
    style: trimmedStyle,
    createdBy: session.uid,
    createdAt: new Date(),
  })
  revalidatePath('/', 'layout')
  return { ok: true }
}
