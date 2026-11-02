import { Stack } from 'expo-router'

import { FeatureCard, Shelf, ShowCard } from '@/components/cards'
import { Empty, EpisodeRow, Screen, SectionTitle } from '@/components/parts'
import { episodes, features, shows } from '@/data/mock'
import { useIsHidden } from '@/library/LibraryProvider'

/**
 * 新着・おすすめ。注目の特集、全体の人気順のトップ番組（横並び）、新着エピソードを出す。
 * 非表示にした番組は、どの欄にも出さない。
 * @returns 新着・おすすめ画面
 */
const Discover = () => {
  const isHidden = useIsHidden()
  const popular = shows.filter((s) => !isHidden(s.id)).sort((a, b) => a.popularityRank - b.popularityRank)
  const latest = episodes
    .filter((e) => !isHidden(e.showId))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3)
  const shownFeatures = features.filter((f) => !isHidden(f.showId))
  return (
    <Screen>
      <Stack.Screen options={{ title: '新着・おすすめ' }} />
      <SectionTitle title="注目の特集" />
      {shownFeatures.length === 0 && <Empty text="いまは特集がありません。" />}
      {shownFeatures.map((f) => <FeatureCard key={f.id} feature={f} tab="discover" />)}
      <SectionTitle title="トップ番組" />
      <Shelf>
        {popular.map((s, i) => <ShowCard key={s.id} show={s} tab="discover" note={`${i + 1}位・${s.category}`} />)}
      </Shelf>
      <SectionTitle title="新着エピソード" />
      {latest.map((e) => <EpisodeRow key={e.id} episode={e} withShow />)}
    </Screen>
  )
}

export default Discover
