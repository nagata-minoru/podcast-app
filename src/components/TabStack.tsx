import { Stack } from 'expo-router'

import { usePalette } from '@/theme'

/**
 * 各タブの中の画面履歴。番組詳細はこのスタックに積み、戻ると開いたタブの画面へ戻る。
 * @returns タブ内のスタックナビゲーター
 */
const TabStack = () => {
  const c = usePalette()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerBackButtonDisplayMode: 'minimal',
      }} />
  )
}

export default TabStack
