import { useSyncExternalStore } from 'react'

import * as mock from '@/data/mock'
import { loadFeeds, onStorageCleared, saveFeed, saveFeedEpisode } from '@/storage/storage'
import type { Episode, Show } from '@/types'

/** 番組とエピソードの一覧。追加や更新のたびに作り直し、同じ中身のあいだは同じものを返す */
export type Catalog = { shows: Show[], episodes: Episode[] }

/** 架空のデータだけのカタログ */
const initial: Catalog = { shows: mock.shows, episodes: mock.episodes }

/**
 * 架空のデータに、保存してあるフィードの番組を足したカタログを作る。
 * @returns カタログ
 */
const loadCatalog = (): Catalog => {
  const feeds = loadFeeds()
  if (feeds.length === 0) return initial
  return {
    shows: [...initial.shows, ...feeds.map((f) => f.show)],
    episodes: [...initial.episodes, ...feeds.flatMap((f) => f.episodes)],
  }
}

/** いまのカタログ。最初に使うときに保存から読む */
let current: Catalog | undefined
const listeners = new Set<() => void>()

/**
 * カタログを差し替え、使っている画面に知らせる。
 * @param next 新しいカタログ
 */
const update = (next: Catalog) => {
  current = next
  listeners.forEach((l) => l())
}

/**
 * いまのカタログを返す。
 * @returns カタログ
 */
export const getCatalog = () => {
  current ??= loadCatalog()
  return current
}

/**
 * フィードから取り込んだ番組を加える。同じ番組がすでにあれば、番組とエピソードを入れ替える。
 * @param show 番組
 * @param episodes その番組のエピソード
 */
export const addShow = (show: Show, episodes: Episode[]) => {
  const { shows, episodes: all } = getCatalog()
  const exists = shows.some((s) => s.id === show.id)
  update({
    shows: exists ? shows.map((s) => (s.id === show.id ? show : s)) : [...shows, show],
    episodes: [...all.filter((e) => e.showId !== show.id), ...episodes],
  })
  saveFeed(show, episodes)
}

/**
 * 取り直したフィードを、前に取り込んだ番組に合わせて入れる。番組 ID は変えない。
 * フィードから消えた回は、再生位置や保存済みが残るよう、前のまま残す。
 * 前に読み込んだ音声の長さは、フィードに長さがない回だけ引き継ぐ。
 * @param showId 前に取り込んだ番組の ID
 * @param fresh 取り直した番組とエピソード（ID は showId で作ったもの）
 * @param feedUrl これから使うフィードの URL（移転していれば移転先）
 * @returns 新しく増えた回の数。番組が見つからなければ 0
 */
export const mergeFeed = (showId: string, fresh: { show: Show, episodes: Episode[] }, feedUrl: string) => {
  const before = getCatalog().episodes.filter((e) => e.showId === showId)
  const known = new Map(before.map((e) => [e.id, e]))
  if (!findShow(showId)) return 0
  const episodes = fresh.episodes.map((e) => {
    const old = known.get(e.id)
    return old && e.duration === 0 && old.duration > 0 ? { ...e, duration: old.duration } : e
  })
  const freshIds = new Set(episodes.map((e) => e.id))
  const kept = before.filter((e) => !freshIds.has(e.id))
  addShow({ ...fresh.show, id: showId, feedUrl }, [...episodes, ...kept])
  return episodes.filter((e) => !known.has(e.id)).length
}

/**
 * エピソードの再生時間を、読み込んだ音声の実際の長さに直す。フィードの再生時間はないことや誤っていることがあるため。
 * @param episodeId エピソード ID
 * @param duration 実際の長さ（秒）
 */
export const setEpisodeDuration = (episodeId: string, duration: number) => {
  const episode = findEpisode(episodeId)
  if (!episode || episode.duration === duration) return
  const next = { ...episode, duration }
  const catalog = getCatalog()
  update({ ...catalog, episodes: catalog.episodes.map((e) => (e.id === episodeId ? next : e)) })
  saveFeedEpisode(next)
}

/** 保存から読み直す。保存を消したときは架空のデータだけに戻る */
export const reloadCatalog = () => {
  const next = loadCatalog()
  if (next !== current) update(next)
}

onStorageCleared(reloadCatalog)

/**
 * 変更を受け取る。
 * @param listener 変更のたびに呼ぶ関数
 * @returns 受け取りをやめる関数
 */
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * カタログを取り出し、番組の追加や更新で描き直す。
 * @returns カタログ
 */
export const useCatalog = () => useSyncExternalStore(subscribe, getCatalog)

/**
 * ID から番組を探す。
 * @param id 番組 ID
 * @returns 番組。見つからなければ undefined
 */
export const findShow = (id: string) => getCatalog().shows.find((s) => s.id === id)

/**
 * ID からエピソードを探す。
 * @param id エピソード ID
 * @returns エピソード。見つからなければ undefined
 */
export const findEpisode = (id: string) => getCatalog().episodes.find((e) => e.id === id)

/**
 * 番組のエピソードを新しい順に返す。
 * @param showId 番組 ID
 * @returns 公開日の新しい順に並べたエピソード
 */
export const episodesOfShow = (showId: string) =>
  getCatalog().episodes.filter((e) => e.showId === showId).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
