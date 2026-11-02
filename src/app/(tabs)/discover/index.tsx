import { Stack } from 'expo-router'

import { EpisodeRow, Screen, SectionTitle, ShowRow } from '@/components/parts'
import { episodes, shows } from '@/data/mock'

/**
 * 新着・おすすめ。全体の人気順のトップ番組と、新着エピソードを出す。
 * @returns 新着・おすすめ画面
 */
const Discover = () => {
  const popular = [...shows].sort((a, b) => a.popularityRank - b.popularityRank)
  const latest = [...episodes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3)
  return (
    <Screen>
      <Stack.Screen options={{ title: '新着・おすすめ' }} />
      <SectionTitle title="トップ番組" />
      {popular.map((s, i) => <ShowRow key={s.id} show={s} tab="discover" note={`${i + 1}位・${s.category}`} />)}
      <SectionTitle title="新着エピソード" />
      {latest.map((e) => <EpisodeRow key={e.id} episode={e} />)}
    </Screen>
  )
}

export default Discover
