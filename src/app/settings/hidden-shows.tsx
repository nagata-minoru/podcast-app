import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native'

import { Artwork, Screen } from '@/components/parts'
import { findShow, useCatalog } from '@/data/catalog'
import { useLibrary } from '@/library/LibraryProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Show } from '@/types'

/**
 * 非表示にした番組の一覧。各番組を再表示できる。再表示してもフォローは戻さない。
 * @returns 非表示にした番組の画面
 */
const HiddenShows = () => {
  const c = usePalette()
  const { hiddenShowIds, unhide } = useLibrary()
  useCatalog()
  const hidden = hiddenShowIds.map(findShow).filter((s): s is Show => !!s)

  /**
   * 番組を再表示し、一覧から消えたことを読み上げる。
   * @param show 再表示する番組
   */
  const restore = (show: Show) => {
    unhide(show.id)
    AccessibilityInfo.announceForAccessibility(`${show.title}を再表示しました`)
  }

  return (
    <Screen>
      {hidden.length === 0 && <Text style={{ color: c.subText }}>非表示にした番組はありません。</Text>}
      {hidden.length > 0 && (
        <Text style={{ color: c.subText }}>再表示しても、フォローは戻りません。必要なら番組詳細でフォローしてください。</Text>
      )}
      {hidden.map((show) => (
        <View key={show.id} style={styles.row}>
          <Artwork title={show.title} />
          <View style={styles.body}>
            <Text style={[styles.title, { color: c.text }]}>{show.title}</Text>
            <Text style={{ color: c.subText, fontSize: 13 }}>{show.publisher}</Text>
          </View>
          <Pressable
            accessibilityRole="button" accessibilityLabel={`${show.title}を再表示`} onPress={() => restore(show)}
            style={[styles.button, { borderColor: c.border }]}>
            <Text style={{ color: c.text }}>再表示</Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TAP },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  button: {
    minHeight: MIN_TAP, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})

export default HiddenShows
