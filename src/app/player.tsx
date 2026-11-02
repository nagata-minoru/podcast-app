import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MIN_TAP, usePalette } from '@/theme'

/**
 * 再生画面（モーダル）。骨組みの段階では枠だけを置き、手順2で PlayerProvider とつなぐ。
 * @returns 再生画面
 */
const Player = () => {
  const c = usePalette()
  return (
    <View style={[styles.wrap, { backgroundColor: c.background }]}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="再生画面を閉じる"
        onPress={() => router.back()} style={styles.close}>
        <Text style={{ color: c.text, fontSize: 24 }}>⌄</Text>
      </Pressable>
      <Text style={{ color: c.subText }}>再生画面（手順2で実装）</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 16 },
  close: { minWidth: MIN_TAP, minHeight: MIN_TAP, justifyContent: 'center' },
})

export default Player
