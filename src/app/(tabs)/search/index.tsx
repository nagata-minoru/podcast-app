import { Stack } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'

import { EpisodeRow, Screen, SectionTitle, ShowRow } from '@/components/parts'
import { Segmented } from '@/components/Segmented'
import { episodes, shows } from '@/data/mock'
import { MIN_TAP, usePalette } from '@/theme'

const TOPICS = ['ニュース', '科学', 'ビジネス', 'コメディ'] as const

/**
 * 検索。入力前は人気のテーマ、入力後は番組とエピソードの結果を出す。
 * 検索語はこの画面の state に持つため、番組詳細から戻っても保持される。
 * @returns 検索画面
 */
const Search = () => {
  const c = usePalette()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const showHits = shows.filter((s) => `${s.title} ${s.category} ${s.description}`.toLowerCase().includes(q))
  const episodeHits = episodes.filter((e) => `${e.title} ${e.summary}`.toLowerCase().includes(q))
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
          {showHits.map((s) => <ShowRow key={s.id} show={s} tab="search" note={`${s.publisher}・${s.category}`} />)}
          <SectionTitle title="エピソード" />
          {episodeHits.map((e) => <EpisodeRow key={e.id} episode={e} />)}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  input: { minHeight: MIN_TAP, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
})

export default Search
