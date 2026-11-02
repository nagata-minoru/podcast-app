import { useColorScheme } from 'react-native'

/** 画面全体で使う色の組。ライト・ダークで同じキーを持つ */
export type Palette = {
  background: string
  surface: string
  text: string
  subText: string
  accent: string
  onAccent: string
  border: string
}

const light: Palette = {
  background: '#FFFFFF',
  surface: '#F2F2F5',
  text: '#111114',
  subText: '#55555E',
  accent: '#5B3FD9',
  onAccent: '#FFFFFF',
  border: '#D5D5DC',
}

const dark: Palette = {
  background: '#0E0E11',
  surface: '#1C1C21',
  text: '#F4F4F6',
  subText: '#B4B4BE',
  accent: '#A894FF',
  onAccent: '#14102B',
  border: '#34343C',
}

/** ライト・ダークの色の組。テストでコントラスト比を確かめるために公開する */
export const palettes = { light, dark }

/** 主要操作のタップ領域の最小サイズ（iOS 44pt を基準にする） */
export const MIN_TAP = 44

/**
 * 端末の外観設定に合わせた色の組を返す。
 * @returns ライトまたはダークの Palette
 */
export const usePalette = (): Palette => (useColorScheme() === 'dark' ? dark : light)
