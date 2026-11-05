import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AppState, useColorScheme } from 'react-native'

import { useHeaderOptions } from '@/components/TabStack'
import { feedShowIds, refreshShows } from '@/feed/refreshFeeds'

import { LibraryProvider, useLibrary } from '@/library/LibraryProvider'
import { PlayerProvider } from '@/player/PlayerProvider'
import { SettingsProvider } from '@/settings/SettingsProvider'

/**
 * アプリを開いたときと前面に戻ったときに、RSS で追加したフォロー中の番組を取り直す。
 * 最後に取ってから 30 分たっていない番組は取り直さない。失敗しても知らせず、番組詳細に理由を出す。
 */
const useAutoRefresh = () => {
  const { followedShowIds, hiddenShowIds } = useLibrary()
  useEffect(() => {
    const run = () => refreshShows(feedShowIds(followedShowIds, hiddenShowIds))
    run()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run()
    })
    return () => sub.remove()
  }, [followedShowIds, hiddenShowIds])
}

/**
 * 外観に合わせた画面スタック。4タブの上に、再生画面（モーダル）と設定を重ねる。
 * 設定でテーマを変えると useColorScheme の値も変わり、ここで色を切り替える。フィードの自動の取り直しもここで始める。
 * @returns テーマを当てた画面スタック
 */
const ThemedStack = () => {
  useAutoRefresh()
  const dark = useColorScheme() === 'dark'
  const headerOptions = useHeaderOptions()
  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={headerOptions}>
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
