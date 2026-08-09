import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

/**
 * AI Tools (사용자 확정 사양, 2026-08-09) — 메뉴 포스터 / 가상 피팅룸 / 가상 네일룸 / 펫 스튜디오.
 * 전부 gpt-image-2(low) 실호출. 결과는 aiJobs 에 **자동 저장**되어 저장 버튼을 누르지
 * 않아도 히스토리에서 다시 확인할 수 있다.
 */

export const AI_TOOLS = ['menu-poster', 'fitting', 'nail', 'pet'] as const
export type AiToolId = (typeof AI_TOOLS)[number]

export type AiJobView = {
  id: string
  tool: AiToolId
  step: string
  resultURL: string
  createdAt: string | null
}

export type MenuTemplate = {
  id: string
  name: string
  /** 프롬프트 스타일 조각 (영문) — 이미지 모델에 그대로 들어간다 */
  style: string
  builtin: boolean
}

/**
 * 기본 템플릿 7종. 관리자가 Firestore(aiTemplates)로 추가하면 뒤에 붙는다.
 * 이름은 화면에 그대로 노출되는 콘텐츠(데이터)다.
 */
export const DEFAULT_MENU_TEMPLATES: MenuTemplate[] = [
  {
    id: 'modern-chalk',
    name: '모던 칠판',
    style:
      'modern chalkboard style, deep matte black background, elegant white and pastel chalk lettering, subtle chalk illustrations around the dish',
    builtin: true,
  },
  {
    id: 'warm-cafe',
    name: '따뜻한 카페',
    style:
      'warm cozy cafe poster, cream and caramel tones, soft window light, kraft paper texture, rounded serif typography',
    builtin: true,
  },
  {
    id: 'minimal-white',
    name: '미니멀 화이트',
    style:
      'minimal white gallery style, generous negative space, thin sans-serif typography, the dish floating as the single hero object with a soft shadow',
    builtin: true,
  },
  {
    id: 'retro-jeju',
    name: '레트로 제주',
    style:
      'retro Jeju travel-poster style, faded orange and teal palette, grainy print texture, tangerine and haenyeo motifs in the border',
    builtin: true,
  },
  {
    id: 'elegant-dark',
    name: '엘레강스 다크',
    style:
      'high-end restaurant poster, dark moody background, dramatic spotlight on the dish, gold foil accents, refined serif typography',
    builtin: true,
  },
  {
    id: 'pop-vivid',
    name: '팝 비비드',
    style:
      'playful pop-art style, bold vivid color blocks, thick outlines, dynamic diagonal composition, sticker-like price badge',
    builtin: true,
  },
  {
    id: 'hand-drawn',
    name: '손글씨 감성',
    style:
      'hand-drawn illustrated menu, warm beige paper, watercolor accents around the photo, friendly Korean handwriting-style lettering',
    builtin: true,
  },
]

export async function listMenuTemplates(): Promise<MenuTemplate[]> {
  const snap = await getAdminDb().collection('aiTemplates').where('tool', '==', 'menu-poster').get()
  const extra: MenuTemplate[] = snap.docs.map((doc) => ({
    id: doc.id,
    name: (doc.data().name as string) ?? '',
    style: (doc.data().style as string) ?? '',
    builtin: false,
  }))
  return [...DEFAULT_MENU_TEMPLATES, ...extra]
}

/** 내 생성 내역 — 자동 저장분. 최신순. */
export async function listAiJobs(uid: string, tool: AiToolId, limit = 24): Promise<AiJobView[]> {
  const snap = await getAdminDb()
    .collection('aiJobs')
    .where('uid', '==', uid)
    .where('tool', '==', tool)
    .limit(60)
    .get()
  return snap.docs
    .map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        tool,
        step: (d.step as string) ?? '',
        resultURL: (d.resultURL as string) ?? '',
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
      }
    })
    .filter((j) => j.resultURL)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, limit)
}
