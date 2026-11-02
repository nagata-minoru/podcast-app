import { type Palette, palettes } from '@/theme'

/**
 * 色の相対輝度を求める（WCAG 2 の定義）。
 * @param hex `#RRGGBB` 形式の色
 * @returns 相対輝度（0〜1）
 */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * 2色のコントラスト比を求める。
 * @param a 1つ目の色
 * @param b 2つ目の色
 * @returns コントラスト比（1〜21）
 */
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** 文字の色と、その文字を置く背景の組 */
const TEXT_PAIRS: [keyof Palette, keyof Palette][] = [
  ['text', 'background'], ['text', 'surface'], ['subText', 'background'], ['subText', 'surface'],
  ['onAccent', 'accent'], ['accent', 'background'], ['accent', 'surface'],
]

describe.each(Object.entries(palettes))('%s テーマ', (_, palette) => {
  it.each(TEXT_PAIRS)('%s と %s のコントラスト比は 4.5 以上', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5)
  })
})
