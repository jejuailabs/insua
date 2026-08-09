# 10. AI 기능 — 어댑터 계약

> **이번 범위에서 실제 AI 호출은 구현하지 않는다.** 인터페이스와 UI 상태(대기/진행/실패)까지만 만든다.
> 이유: 모델·요금·저작권 정책이 확정되지 않았고, 지금 붙이면 나중에 전부 갈아엎어야 한다.
> 각 기능은 `status: 'coming-soon'` 으로 표시하고, 어댑터 구현체는 `MockAdapter` 를 쓴다.

## 1. 대상 기능 (제안서 5.5 + `ref-02` 이미지)

| 기능                              | 화면 라벨             | 상태                   |
| --------------------------------- | --------------------- | ---------------------- |
| 메뉴 포스터 생성                  | 메뉴판 이미지         | **실호출 O** (원본 충실성 원칙 아래) |
| 로고송/주제가 생성                | 주제가 만들기         | 인터페이스만           |
| 가상 스튜디오 (의류·헤어·네일·펫) | 가상 스튜디오         | 인터페이스만           |
| 상담 요약                         | 상담로그 AI 요약      | 인터페이스만           |
| 익명글 비식별화                   | (자동, UI 없음)       | **정규식 최소 구현 O** |
| 랜딩페이지 자동 생성              | 매장 정보 자동 채우기 | 인터페이스만           |

이미지에 `주재파 만들기` 로 보이는 라벨이 있는데 `주제가 만들기`(로고송)의 오기로 판단했다.
→ **불확실. 사용자 확인 필요.** 코드에서는 `themeSong` 키를 쓴다.

## 2. 어댑터 인터페이스

```ts
// src/lib/ai/types.ts
export type AiJobStatus = 'idle' | 'queued' | 'running' | 'done' | 'failed' | 'unavailable'

export interface AiJob<TResult> {
  id: string
  status: AiJobStatus
  result: TResult | null
  error: { code: string; message: string } | null
  createdAt: Date
}

export interface AiAdapter {
  readonly available: boolean

  generatePoster(input: {
    imageUrl: string
    storeName: string
    items: { name: string; price: number }[]
    style?: 'classic' | 'modern' | 'handwritten'
  }): Promise<AiJob<{ imageUrl: string }>>

  generateThemeSong(input: {
    storeName: string
    mood: string
    lengthSec: number
  }): Promise<AiJob<{ audioUrl: string }>>

  virtualStudio(input: {
    imageUrl: string
    domain: 'apparel' | 'hair' | 'nail' | 'pet'
    preset: string
  }): Promise<AiJob<{ imageUrl: string }>>

  summarizeInteraction(input: {
    text: string
    context?: { contactName?: string; company?: string }
  }): Promise<AiJob<{ summary: string; nextActions: string[] }>>

  redactAnonymous(input: { text: string }): Promise<
    AiJob<{
      text: string
      redactions: { type: 'store' | 'address' | 'person' | 'phone'; count: number }[]
    }>
  >

  enrichStoreProfile(input: {
    storeName: string
    address?: string
    phone?: string
  }): Promise<AiJob<{ tagline?: string; description?: string; hours?: string }>>
}
```

```ts
// src/lib/ai/index.ts
import { MockAdapter } from './mock'

export const ai: AiAdapter = new MockAdapter() // 실제 구현체로 교체 지점
```

**규칙**: 화면 코드는 `ai` 만 import 한다. 특정 벤더 SDK를 컴포넌트에서 직접 부르지 않는다.
이 한 줄만 바꾸면 실제 구현으로 넘어갈 수 있어야 한다.

## 3. MockAdapter 동작

- `available = false`
- 모든 메서드는 800ms 지연 후 `status: 'unavailable'` 을 반환한다.
- UI는 이 상태를 받아 **"준비 중입니다"** 를 표시한다.
  **가짜 결과 이미지를 반환하지 말 것.** 데모용 이미지가 실제 기능처럼 보이면 나중에 사고가 난다.

## 4. UI 상태

| status               | 화면                                   |
| -------------------- | -------------------------------------- |
| `idle`               | 입력 폼 + `만들기` 버튼                |
| `queued` / `running` | 스켈레톤 + `만드는 중` + 취소 버튼     |
| `done`               | 결과 미리보기 + `저장` / `다시 만들기` |
| `failed`             | 무엇이 실패했는지 + `다시 시도`        |
| `unavailable`        | `준비 중입니다` + 알림 신청 버튼       |

## 5. 유·무료 정책 (제안서 5.5) — 지금 구현할 것

이 정책은 AI 기능 자체보다 **비즈니스 구조**라서, AI 호출 없이도 지금 만든다.

```ts
export function canUseAiTools(user: User): { allowed: boolean; reason: 'agent' | 'paid' | 'none' } {
  if (user.agentId) return { allowed: true, reason: 'agent' } // 담당 설계사 있음 → 무료
  return { allowed: false, reason: 'none' } // 없음 → 유료 안내
}
```

- 담당 설계사 있음 → 툴 진입 가능 (실제 실행은 `unavailable` 이지만 게이트는 통과)
- 없음 → 안내 시트: `aiTools.paidWithoutAgent` — "담당 설계사를 지정하면 무료로 전환됩니다."
  - `[설계사 지정하기]` 버튼 → 설계사 검색/코드 입력
- 설계사를 지정하면 `users.agentId` 설정 + 해당 설계사의 `contacts` 에 후보로 등록된다.

> 이 구조가 제안서가 말한 "AI 툴을 미끼로 한 설계사 신규 고객 확보 채널"이다.
> 다만 **사용자에게 무엇이 일어나는지 반드시 명시적으로 고지하고 동의를 받는다.**
> "지정하면 내 연락처와 업장 정보가 해당 설계사에게 전달됩니다"를 흐리게 쓰지 말 것.
> 이걸 숨기면 개인정보 문제이자 신뢰 문제가 된다.

## 6. 익명글 비식별화 — 이번에 실제로 만드는 유일한 것

LLM 없이 정규식 기반 최소 마스킹.

```ts
const PATTERNS: { type: Redaction['type']; re: RegExp; replace: string }[] = [
  { type: 'phone', re: /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, replace: '***-****-****' },
  {
    type: 'address',
    re: /[가-힣]+(시|군|구)\s?[가-힣0-9]+(로|길|동|읍|면)\s?\d+(-\d+)?/g,
    replace: '○○○',
  },
  {
    type: 'store',
    re: /[가-힣A-Za-z0-9]{2,}\s?(식당|카페|베이커리|미용실|정육점|마트|치킨|분식)/g,
    replace: '○○○',
  },
]
```

- 마스킹 **전 원문**은 `rawBodyRef` 경로에 서버 전용으로 보관한다.
  보존기간 정책이 아직 없다 → **90일 후 자동 삭제**를 기본값으로 잡되, 법무 검토 대상으로 표시.
- 마스킹 결과를 작성자에게 미리 보여주고 `이대로 올리기` / `수정하기` 를 고르게 한다.
  자동 마스킹이 완벽하지 않다는 걸 사용자가 알아야 한다.
- 정규식으로 잡히지 않는 식별정보(사람 이름, 특징적 서술)는 못 거른다.
  이 한계를 UI에 명시한다: `이름이나 구체적인 상황 묘사는 직접 지워주세요.`

## 7. AI 생성물 표기

AI가 만든 이미지·음원·텍스트는 화면에 **`AI 생성` 배지**를 붙인다.
`post.aiGeneratedImageURL` 이 있으면 자동으로 표시된다. 이건 옵션이 아니다.

## 7.5 음식 사진 원본 충실성 원칙 (메뉴 포스터)

손님이 실제로 받는 음식과 다른 이미지를 만들면 **허위·과장 광고**가 된다.
메뉴 포스터의 음식 사진 처리는 아래 두 층으로 나눈다. 프롬프트에 반드시 반영한다.

- **허용 (포토샵 보정 수준)** — 노출·화이트밸런스·채도·대비·선명도 보정, 배경 잡동사니 정리, 크롭.
- **금지 (음식 자체 변형)** — 음식·재료·고명·그릇의 추가/제거/확대/교체, 양·플레이팅 변경.
- 장식(프레임·패턴·일러스트·타이포)은 **사진 바깥**에만 얹는다. 음식 안에는 손대지 않는다.

전면 금지가 아니라 "사진 밖은 자유, 접시 안은 불가침"이 기준이다.

## 8. 미확정 사항 (임의로 정하지 말 것)

- 어떤 모델/벤더를 쓸지
- 생성물의 저작권 귀속 (플랫폼 / 사업자 / 공동)
- 상담 녹음의 STT 처리 위치 (기기 내 / 서버 / 외부 API) — 개인정보 영향이 크다
- AI 툴 유료 요금
- 생성 횟수 제한
