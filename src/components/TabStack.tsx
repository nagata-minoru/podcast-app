import { Stack } from 'expo-router'

import { usePalette } from '@/theme'

/**
 * 画面スタックのヘッダーの共通の見た目。背景色を指定して、ヘッダーを透けさせない。
 * iOS 26 以降は背景色を指定しないとヘッダーが透け、画面の上の中身がヘッダーの裏に隠れるため。
 * @returns Stack の screenOptions
 */
export const useHeaderOptions = () => {
  const c = usePalette()
  return {
    headerStyle: { backgroundColor: c.background },
    headerTintColor: c.text,
    headerBackButtonDisplayMode: 'minimal' as const,
  }
}

/**
 * 各タブの中の画面履歴。番組詳細はこのスタックに積み、戻ると開いたタブの画面へ戻る。
 * @returns タブ内のスタックナビゲーター
 */
const TabStack = () => <Stack screenOptions={useHeaderOptions()} />

export default TabStack
