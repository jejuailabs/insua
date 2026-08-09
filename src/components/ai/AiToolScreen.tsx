'use client'

import { Download, ImageIcon, Plus, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { addMenuTemplate, runAiTool } from '@/lib/ai/toolActions'
import { compressImage } from '@/lib/utils/compressImage'
import type { AiJobView, AiToolId, MenuTemplate } from '@/lib/ai/tools'
import { cn } from '@/lib/utils/cn'

/**
 * AI Tools 공용 화면 (사용자 확정 사양).
 * 업로드 → 옵션 → 생성(gpt-image-2 low) → 결과 + 다운로드.
 * 모든 결과는 서버에서 자동 저장돼 아래 히스토리에 남는다 — 저장 버튼과 무관.
 */
export function AiToolScreen({
  tool,
  templates,
  history,
  isAdmin,
}: {
  tool: AiToolId
  templates: MenuTemplate[]
  history: AiJobView[]
  isAdmin: boolean
}) {
  const t = useTranslations('aiTools')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [menuName, setMenuName] = useState('')
  const [price, setPrice] = useState('')
  const [sizeLabel, setSizeLabel] = useState('')
  /** 피팅룸 2단계 — 1단계(스튜디오) 결과 URL 이 잡히면 옷 업로드 단계로 전환 */
  const [studioBase, setStudioBase] = useState<string | null>(null)

  const fittingStage: 'studio' | 'wear' = tool === 'fitting' && studioBase ? 'wear' : 'studio'
  const needsImage2 = tool === 'nail' || (tool === 'fitting' && fittingStage === 'wear')
  const canGenerate =
    fittingStage === 'wear' ? Boolean(image2) : Boolean(image1) && (tool !== 'nail' || image2)

  function generate() {
    if (!canGenerate || pending) return
    setFailed(false)
    const form = new FormData()
    form.set('tool', tool)
    if (tool === 'fitting') {
      form.set('stage', fittingStage)
      form.set('sizeLabel', sizeLabel)
      if (fittingStage === 'wear' && studioBase) form.set('baseUrl', studioBase)
    }
    if (tool === 'menu-poster') {
      form.set('templateId', templateId)
      form.set('menuName', menuName)
      form.set('price', price)
    }
    startTransition(async () => {
      // Vercel 요청 한도(4.5MB) 안으로 — 업로드 전 압축
      if (image1 && fittingStage !== 'wear') form.set('image1', await compressImage(image1))
      if (image2) form.set('image2', await compressImage(image2))
      const res = await runAiTool(form)
      if (!res.ok) {
        setFailed(true)
        return
      }
      setResult(res.resultURL)
      if (tool === 'fitting' && fittingStage === 'studio') {
        setStudioBase(res.resultURL)
        setImage2(null)
      }
      router.refresh()
    })
  }

  const labels: Record<AiToolId, { input1: string; input2?: string }> = {
    'menu-poster': { input1: t('inputMenuPhoto') },
    fitting: { input1: t('inputPersonPhoto'), input2: t('inputClothing') },
    nail: { input1: t('inputHandPhoto'), input2: t('inputNailDesign') },
    pet: { input1: t('inputPetPhoto'), input2: t('inputPetAccessory') },
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 입력 */}
      <section className="rounded-card border border-line bg-surface p-4">
        {tool === 'fitting' && (
          <div className="mb-3 flex gap-1.5">
            {(['studio', 'wear'] as const).map((stage) => (
              <span
                key={stage}
                className={cn(
                  'rounded-chip px-2.5 py-1 text-micro',
                  fittingStage === stage
                    ? 'bg-accent-strong text-accent-on'
                    : 'bg-surface-2 text-content-muted',
                )}
              >
                {stage === 'studio' ? t('stageStudio') : t('stageWear')}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {fittingStage === 'wear' ? (
            <div className="flex flex-col gap-1">
              <span className="text-label text-content-muted">{t('stageStudio')}</span>
              <div className="relative aspect-[3/4] overflow-hidden rounded-inner border border-line">
                {studioBase && (
                  <Image src={studioBase} alt="" fill sizes="200px" className="object-cover" />
                )}
              </div>
            </div>
          ) : (
            <UploadBox label={labels[tool].input1} file={image1} onPick={setImage1} />
          )}

          {(needsImage2 || tool === 'pet') && labels[tool].input2 && (
            <UploadBox label={labels[tool].input2!} file={image2} onPick={setImage2} />
          )}
        </div>

        {/* 도구별 옵션 */}
        {tool === 'menu-poster' && (
          <>
            <p className="mt-3 text-label text-content">{t('templates')}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={cn(
                    'rounded-chip border px-2.5 py-1.5 text-micro',
                    templateId === template.id
                      ? 'border-accent bg-accent-soft text-accent-strong'
                      : 'border-line text-content-muted',
                  )}
                >
                  {template.name}
                </button>
              ))}
              {isAdmin && <AddTemplateButton />}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder={t('posterMenuName')}
                className="min-h-11 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder={t('posterPrice')}
                className="min-h-11 rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
              />
            </div>
          </>
        )}

        {tool === 'fitting' && fittingStage === 'studio' && (
          <input
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
            placeholder={t('sizePlaceholder')}
            className="mt-3 min-h-11 w-full rounded-chip border border-line bg-bg px-4 text-body text-content outline-none focus:border-accent"
          />
        )}

        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate || pending}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-chip bg-accent-strong text-label text-accent-on transition-opacity disabled:opacity-50"
        >
          <Sparkles size={16} aria-hidden />
          {pending ? t('generating') : t('generate')}
        </button>
        {failed && (
          <p role="alert" className="mt-2 text-caption text-danger">
            {t('failed')}
          </p>
        )}
      </section>

      {/* 결과 */}
      {result && (
        <section className="rounded-card border border-accent bg-surface p-4">
          <p className="flex items-center gap-1.5 text-label text-accent-strong">
            <Sparkles size={13} aria-hidden />
            {t('resultTitle')} · {t('aiBadge')}
          </p>
          <div className="relative mt-2 aspect-[3/4] overflow-hidden rounded-inner">
            <Image src={result} alt="" fill sizes="480px" className="object-cover" />
          </div>
          <a
            href={result}
            download
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-chip border border-line text-label text-content"
          >
            <Download size={16} aria-hidden />
            {t('download')}
          </a>
        </section>
      )}

      {/* 히스토리 — 자동 저장분 */}
      <section>
        <h2 className="text-subtitle text-content">{t('history')}</h2>
        <p className="mt-0.5 text-micro text-content-faint">{t('historyHint')}</p>
        {history.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-surface p-6 text-center text-caption text-content-muted">
            {t('historyEmpty')}
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {history.map((job) => (
              <li key={job.id}>
                <a
                  href={job.resultURL}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-[3/4] overflow-hidden rounded-inner border border-line"
                >
                  <Image src={job.resultURL} alt="" fill sizes="33vw" className="object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function UploadBox({
  label,
  file,
  onPick,
}: {
  label: string
  file: File | null
  onPick: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <label className="flex flex-col gap-1">
      <span className="text-label text-content-muted">{label}</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-inner border border-line bg-surface-2"
      >
        {preview && file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={22} aria-hidden className="text-content-faint" />
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          onPick(picked)
          setPreview(picked ? URL.createObjectURL(picked) : null)
        }}
      />
    </label>
  )
}

/** 템플릿 추가 — 관리자 전용 (사용자 확정 사양). */
function AddTemplateButton() {
  const t = useTranslations('aiTools')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [style, setStyle] = useState('')
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-chip border border-dashed border-line px-2.5 py-1.5 text-micro text-content-muted"
      >
        <Plus size={12} aria-hidden />
        {t('addTemplate')}
      </button>
    )
  }

  return (
    <span className="flex w-full flex-col gap-1.5 rounded-inner border border-line bg-surface-2 p-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('templateName')}
        className="min-h-10 rounded-chip border border-line bg-bg px-3 text-caption text-content outline-none"
      />
      <input
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        placeholder={t('templateStyle')}
        className="min-h-10 rounded-chip border border-line bg-bg px-3 text-caption text-content outline-none"
      />
      <button
        type="button"
        disabled={!name.trim() || !style.trim() || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await addMenuTemplate(name, style)
            if (res.ok) {
              setOpen(false)
              setName('')
              setStyle('')
              router.refresh()
            }
          })
        }
        className="min-h-10 rounded-chip bg-accent-strong text-caption text-accent-on disabled:opacity-50"
      >
        {t('addTemplate')}
      </button>
    </span>
  )
}
