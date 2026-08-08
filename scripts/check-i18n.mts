/**
 * 번역 누락 검사 (docs/05 §6).
 *
 * ko 를 기준으로 나머지 언어의 누락/잉여 키를 출력한다.
 * 누락은 **경고만** 한다 — 초기에는 ko 폴백이 정상 동작이기 때문이다.
 * 잉여 키(ko 에 없는 키)는 오타이거나 죽은 키이므로 **실패**시킨다.
 *
 *   pnpm i18n:check
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES = ['ko', 'en', 'zh', 'ja'] as const
const BASE = 'ko'
const MESSAGES_DIR = join(process.cwd(), 'messages')

type Messages = { [key: string]: string | Messages }

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')) as Messages
}

/** 중첩 객체를 'a.b.c' 형태의 리프 키 집합으로 편다. */
function flatten(messages: Messages, prefix = ''): Set<string> {
  const keys = new Set<string>()
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') keys.add(path)
    else for (const nested of flatten(value, path)) keys.add(nested)
  }
  return keys
}

const baseKeys = flatten(load(BASE))
let hasExtra = false
let missingTotal = 0

console.log(`기준 ${BASE}: 키 ${baseKeys.size}개\n`)

for (const locale of LOCALES) {
  if (locale === BASE) continue

  const keys = flatten(load(locale))
  const missing = [...baseKeys].filter((key) => !keys.has(key))
  const extra = [...keys].filter((key) => !baseKeys.has(key))

  const status = missing.length === 0 && extra.length === 0 ? 'OK' : `누락 ${missing.length}`
  console.log(`[${locale}] ${status}${extra.length ? `, 잉여 ${extra.length}` : ''}`)

  for (const key of missing) console.log(`  · 누락 ${key}`)
  for (const key of extra) console.log(`  ✗ 잉여 ${key}  (${BASE}.json 에 없는 키)`)

  missingTotal += missing.length
  if (extra.length) hasExtra = true
}

if (hasExtra) {
  console.error(`\n${BASE}.json 에 없는 키가 있다. 오타이거나 지워야 할 키다.`)
  process.exit(1)
}

console.log(
  missingTotal === 0
    ? '\n모든 언어가 기준과 일치한다.'
    : `\n누락 ${missingTotal}개. ${BASE} 로 폴백되므로 빌드는 막지 않는다.`,
)
