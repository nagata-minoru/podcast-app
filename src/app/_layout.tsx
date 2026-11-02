import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'

import { LibraryProvider } from '@/library/LibraryProvider'
import { PlayerProvider } from '@/player/PlayerProvider'
import { SettingsProvider } from '@/settings/SettingsProvider'

/**
 * 外観に合わせた画面スタック。4タブの上に、再生画面（モーダル）と設定を重ねる。
 * 設定でテーマを変えると useColorScheme の値も変わり、ここで色を切り替える。
 * @returns テーマを当てた画面スタック
 */
const ThemedStack = () => {
  const dark = useColorScheme() === 'dark'
  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ title: '設定' }} />
        <Stack.Screen name="settings/hidden-shows" options={{ title: '非表示にした番組' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

/**
 * アプリ全体のレイアウト。設定・ライブラリ・再生の Provider をここに置き、どの画面からも同じ状態を参照できるようにする。
 * 再生を始める速度に設定の値を使うため、PlayerProvider は SettingsProvider の内側に置く。
 * @returns ルートのレイアウト
 */
const RootLayout = () => (
  <SettingsProvider>
    <LibraryProvider>
      <PlayerProvider>
        <ThemedStack />
      </PlayerProvider>
    </LibraryProvider>
  </SettingsProvider>
)

export default RootLayout
