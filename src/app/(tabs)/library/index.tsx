import { Stack } from 'expo-router'
import { useState } from 'react'

import { EpisodeRow, Screen, ShowRow } from '@/components/parts'
import { Segmented } from '@/components/Segmented'
import { episodes, episodesOfShow, findShow, library, progresses } from '@/data/mock'
import { formatDuration } from '@/format'
import type { Show } from '@/types'

const VIEWS = ['登録済み', '保存済み', '履歴'] as const

/**
 * ライブラリの「登録済み」。番組ごとに最新エピソード名を添える。
 * @returns 登録済みの番組行
 */
const Followed = () => (
  <>
    {library.followedShowIds
      .map(findShow)
      .filter((s): s is Show => !!s)
      .map((s) => {
        const latest = episodesOfShow(s.id)[0]?.title ?? 'なし'
        return <ShowRow key={s.id} show={s} tab="library" note={`最新: ${latest}`} />
      })}
  </>
)

/**
 * ライブラリの「保存済み」。後で聴くために保存したエピソード。
 * @returns 保存済みのエピソード行
 */
const Saved = () => (
  <>
    {episodes.filter((e) => library.savedEpisodeIds.includes(e.id)).map((e) => <EpisodeRow key={e.id} episode={e} />)}
  </>
)

/**
 * ライブラリの「履歴」。再生済みと途中のエピソードを新しい順に出す。
 * @returns 履歴のエピソード行
 */
const History = () => (
  <>
    {[...progresses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((p) => {
      const e = episodes.find((x) => x.id === p.episodeId)
      if (!e) return null
      const status = p.completed ? '再生済み' : `残り${formatDuration(e.duration - p.position)}`
      return <EpisodeRow key={e.id} episode={e} status={status} />
    })}
  </>
)

/**
 * ライブラリ。登録済み・保存済み・履歴を切り替えて表示する。
 * @returns ライブラリ画面
 */
const LibraryScreen = () => {
  const [view, setView] = useState<(typeof VIEWS)[number]>('登録済み')
  return (
    <Screen>
      <Stack.Screen options={{ title: 'ライブラリ' }} />
      <Segmented items={VIEWS} value={view} onChange={setView} />
      {view === '登録済み' && <Followed />}
      {view === '保存済み' && <Saved />}
      {view === '履歴' && <History />}
    </Screen>
  )
}

export default LibraryScreen
