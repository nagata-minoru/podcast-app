import { Redirect, Stack, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'

import { Screen } from '@/components/parts'
import { clearStorage } from '@/storage/storage'
import { MIN_TAP, usePalette } from '@/theme'

/**
 * 開発中だけ使う入口。ボタンを押すと端末に保存したものを消し、架空のデータの状態でホームを開く。
 * E2E の起動手順（.maestro/subflows/launch.yaml）が、毎回同じ状態から始めるために開く。
 * Expo Go はこの URL を受けるとアプリを読み込み直すため、読み込み直したあとに出るボタンを押す形にしている。
 * 開発ビルド以外では何も消さずにホームを開く。
 * @returns 保存を消す画面（開発ビルド以外はホームへのリダイレクト）
 */
const DevReset = () => {
  const c = usePalette()
  const router = useRouter()
  if (!__DEV__) return <Redirect href="/home" />

  /** 保存を消してホームに置き換える */
  const reset = () => {
    clearStorage()
    router.replace('/home')
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: '保存を消す（開発用）' }} />
      <Text style={{ color: c.text }}>端末に保存したものを消し、架空のデータの状態に戻します。</Text>
      <Pressable accessibilityRole="button" onPress={reset} style={[styles.button, { backgroundColor: c.text }]}>
        <Text style={[styles.buttonText, { color: c.background }]}>保存を消してホームを開く</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: MIN_TAP, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
})

export default DevReset
