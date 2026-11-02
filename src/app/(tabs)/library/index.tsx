import { Stack } from 'expo-router'
import { useState } from 'react'

import { Empty, EpisodeRow, Screen, ShowRow } from '@/components/parts'
import { Segmented } from '@/components/Segmented'
import { unplayedCount, withEpisodes } from '@/data/derive'
import { episodesOfShow, findShow, useCatalog } from '@/data/catalog'
import { formatClock, formatDuration } from '@/format'
import { useLibrary } from '@/library/LibraryProvider'
import { usePlayer } from '@/player/PlayerProvider'
import type { Show } from '@/types'

const VIEWS = ['登録済み', '保存済み', '履歴'] as const

/**
 * ライブラリの「登録済み」。番組ごとに最新エピソード名と未再生の本数を添える。
 * @returns 登録済みの番組行
 */
const Followed = () => {
  const { followedShowIds } = useLibrary()
  const { progress } = usePlayer()
  useCatalog()
  const list = followedShowIds.map(findShow).filter((s): s is Show => !!s)
  if (list.length === 0) return <Empty text="フォローしている番組はありません。" />
  return (
    <>
      {list.map((s) => {
        const latest = episodesOfShow(s.id)[0]?.title ?? 'なし'
        const note = `未再生 ${unplayedCount(s.id, progress)}本・最新: ${latest}`
        return <ShowRow key={s.id} show={s} tab="library" note={note} />
      })}
    </>
  )
}

/**
 * ライブラリの「保存済み」。後で聴くために保存したエピソード。
 * @returns 保存済みのエピソード行
 */
const Saved = () => {
  const { savedEpisodeIds } = useLibrary()
  const { episodes } = useCatalog()
  const list = episodes.filter((e) => savedEpisodeIds.includes(e.id))
  if (list.length === 0) return <Empty text="保存したエピソードはありません。" />
  return <>{list.map((e) => <EpisodeRow key={e.id} episode={e} withShow />)}</>
}

/**
 * ライブラリの「履歴」。再生済みと途中のエピソードを、最近聴いた順に再生位置と合わせて出す。
 * @returns 履歴のエピソード行
 */
const History = () => {
  const list = withEpisodes(usePlayer().history)
  if (list.length === 0) return <Empty text="再生したエピソードはありません。" />
  return (
    <>
      {list.map(({ episode, progress }) => {
        const rest = formatDuration(episode.duration - progress.position)
        const status = progress.completed ? '再生済み' : `${formatClock(progress.position)}まで再生・残り${rest}`
        return <EpisodeRow key={episode.id} episode={episode} status={status} withShow />
      })}
    </>
  )
}

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
