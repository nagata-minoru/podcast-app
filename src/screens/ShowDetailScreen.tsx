import { Stack, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { Artwork, EpisodeRow, Screen, SectionTitle } from '@/components/parts'
import { episodesOfShow, findShow } from '@/data/mock'
import { usePalette } from '@/theme'

/**
 * 番組詳細（補助画面）。各タブの show/[id] から共通で使う。
 * 骨組みの段階では、上部・概要・エピソード一覧だけを表示する。仕様は docs/show-detail.md。
 * @returns 番組詳細画面
 */
const ShowDetailScreen = () => {
  const c = usePalette()
  const { id } = useLocalSearchParams<{ id: string }>()
  const show = findShow(id)
  if (!show) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '番組詳細' }} />
        <Text style={{ color: c.text }}>番組が見つかりません。</Text>
      </Screen>
    )
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.header}>
        <Artwork title={show.title} size={88} />
        <View style={styles.headerBody}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{show.title}</Text>
          <Text style={{ color: c.subText }}>{show.publisher}</Text>
        </View>
      </View>
      <Text numberOfLines={3} style={{ color: c.text }}>{show.description}</Text>
      <Text style={{ color: c.subText }}>{`${show.category}・${show.updateFrequency}`}</Text>
      <SectionTitle title="エピソード" />
      {episodesOfShow(show.id).map((e) => <EpisodeRow key={e.id} episode={e} />)}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerBody: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: '700' },
})

export default ShowDetailScreen
