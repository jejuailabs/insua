import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, PALETTES } from '@/lib/theme/palette'

/**
 * FOUC 방지 (docs/04 §6.2).
 *
 * next-themes 는 .dark 클래스만 처리한다. data-palette 는 우리가 직접 붙여야 하는데,
 * React 가 마운트된 뒤에 붙이면 첫 페인트가 기본 팔레트로 한 번 그려졌다가 바뀐다.
 * 그래서 <head> 에서 동기적으로 실행되는 인라인 스크립트로 미리 붙인다.
 *
 * 이 스크립트는 사용자 입력을 다루지 않고 자체 문자열만 주입하므로
 * dangerouslySetInnerHTML 사용이 안전하다.
 */
export function PaletteScript() {
  const script = `
try {
  var allowed = ${JSON.stringify(PALETTES)};
  var stored = localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});
  var palette = allowed.indexOf(stored) !== -1 ? stored : ${JSON.stringify(DEFAULT_PALETTE)};
  document.documentElement.setAttribute('data-palette', palette);
} catch (e) {
  document.documentElement.setAttribute('data-palette', ${JSON.stringify(DEFAULT_PALETTE)});
}`.trim()

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
