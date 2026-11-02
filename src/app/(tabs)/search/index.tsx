import { Stack } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { FollowButton } from '@/components/FollowButton'
import { Empty, EpisodeRow, Screen, SectionTitle, ShowRow } from '@/components/parts'
import { Segmented } from '@/components/Segmented'
import { episodes, shows } from '@/data/mock'
import { useIsHidden } from '@/library/LibraryProvider'
import { MIN_TAP, usePalette } from '@/theme'

const TOPICS = ['ニュース', '科学', 'ビジネス', 'コメディ'] as const

/**
 * 検索。入力前は人気のテーマ、入力後は番組とエピソードの結果を出す。番組の結果からはその場でフォローできる。
 * 検索語はこの画面の state に持つため、番組詳細から戻っても保持される。
 * 非表示にした番組は出さない。ただし検索語が番組名と完全一致するときは、末尾に「非表示の番組」と明示して出す。
 * @returns 検索画面
 */
const Search = () => {
  const c = usePalette()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const isHidden = useIsHidden()
  const matched = shows.filter((s) => `${s.title} ${s.category} ${s.description}`.toLowerCase().includes(q))
  const showHits = matched.filter((s) => !isHidden(s.id))
  // 完全一致は、前後の空白と英字の大文字・小文字の違いを無視して判定する
  const hiddenHits = shows.filter((s) => isHidden(s.id) && s.title.trim().toLowerCase() === q)
  const episodeHits = episodes
    .filter((e) => !isHidden(e.showId))
    .filter((e) => `${e.title} ${e.summary}`.toLowerCase().includes(q))
  return (
    <Screen>
      <Stack.Screen options={{ title: '検索' }} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="番組・エピソード・テーマを検索"
        placeholderTextColor={c.subText}
        accessibilityLabel="番組・エピソード・テーマを検索"
        returnKeyType="search"
        style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]} />
      {q === '' ? (
        <>
          <SectionTitle title="人気のテーマ" />
          <Segmented items={TOPICS} onChange={setQuery} />
        </>
      ) : (
        <>
          <SectionTitle title="番組" />
          {showHits.length + hiddenHits.length === 0 && <Empty text="見つかりませんでした。" />}
          {showHits.map((s) => (
            <View key={s.id} style={styles.showHit}>
              <View style={styles.showHitBody}>
                <ShowRow show={s} tab="search" note={`${s.publisher}・${s.category}`} />
              </View>
              <FollowButton show={s} />
            </View>
          ))}
          {hiddenHits.map((s) => <ShowRow key={s.id} show={s} tab="search" note={`⊘ 非表示の番組・${s.publisher}`} />)}
          <SectionTitle title="エピソード" />
          {episodeHits.length === 0 && <Empty text="見つかりませんでした。" />}
          {episodeHits.map((e) => <EpisodeRow key={e.id} episode={e} withShow />)}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  showHit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  showHitBody: { flex: 1 },
  input: { minHeight: MIN_TAP, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
})

export default Search
