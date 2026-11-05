import { Stack, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput } from 'react-native'

import { Screen } from '@/components/parts'
import { addShow } from '@/data/catalog'
import { feedErrorMessage, fetchFeed } from '@/feed/fetchFeed'
import { markFetched } from '@/feed/refreshFeeds'
import { useLibrary } from '@/library/LibraryProvider'
import { MIN_TAP, usePalette } from '@/theme'

/**
 * RSS の URL で番組を追加する（検索タブの補助画面）。検索画面の下の「RSS の URL で追加」から開く。
 * 読み込めたら番組を加えてフォローし、この画面を番組詳細に置き換える。番組詳細から戻ると検索画面に戻る。
 * 追加した番組は端末に保存し、アプリを終了しても残す。
 * @returns 番組の追加画面
 */
const AddFeed = () => {
  const c = usePalette()
  const router = useRouter()
  const { follow } = useLibrary()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  /** 読み込み中に画面を離れたら、結果を使わない */
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  /** 入力した URL のフィードを読み込み、番組を加える。失敗したら理由を出す */
  const submit = async () => {
    if (loading || url.trim() === '') return
    setLoading(true)
    setError(undefined)
    try {
      const { show, episodes } = await fetchFeed(url)
      if (!active.current) return
      addShow(show, episodes)
      markFetched(show.id)
      follow(show.id)
      router.replace(`/search/show/${show.id}`)
    } catch (e) {
      if (active.current) setError(feedErrorMessage(e))
    } finally {
      if (active.current) setLoading(false)
    }
  }

  const disabled = loading || url.trim() === ''
  return (
    <Screen>
      <Stack.Screen options={{ title: 'RSS の URL で追加' }} />
      <Text style={{ color: c.text }}>番組の RSS フィードの URL を入力してください。追加した番組はフォローします。</Text>
      <TextInput
        value={url} onChangeText={setUrl} placeholder="https://example.com/feed.xml"
        placeholderTextColor={c.subText} accessibilityLabel="RSS フィードの URL"
        autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" editable={!loading}
        onSubmitEditing={submit}
        style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]} />
      <Pressable
        accessibilityRole="button" accessibilityState={{ disabled, busy: loading }} disabled={disabled}
        onPress={submit}
        style={[styles.button, { backgroundColor: c.text, opacity: disabled ? 0.4 : 1 }]}>
        <Text style={[styles.buttonText, { color: c.background }]}>追加</Text>
      </Pressable>
      {loading && <Text accessibilityLiveRegion="polite" style={{ color: c.text }}>フィードを読み込んでいます…</Text>}
      {error && (
        <Text accessibilityRole="alert" style={[styles.error, { color: c.text, borderColor: c.border }]}>
          {`⚠ ${error}`}
        </Text>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  input: { minHeight: MIN_TAP, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
  button: { minHeight: MIN_TAP, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  error: { borderWidth: 1, borderRadius: 8, padding: 10 },
})

export default AddFeed
