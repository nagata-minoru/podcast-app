import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'

/**
 * アプリ全体の画面スタック。4タブの上に、再生画面（モーダル）と設定を重ねる。
 * 手順2でここに PlayerProvider を置き、どの画面からも同じ再生状態を参照できるようにする。
 * @returns ルートのレイアウト
 */
const RootLayout = () => {
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

export default RootLayout
