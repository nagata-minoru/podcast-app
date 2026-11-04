import { useState, useSyncExternalStore } from 'react'

import { findShow, mergeFeed } from '@/data/catalog'
import { fetchFeed, refreshErrorMessage } from '@/feed/fetchFeed'
import { loadValue, onStorageCleared, saveValue } from '@/storage/storage'

/**
 * RSS で追加した番組のフィードの取り直し。
 * アプリを開いたとき（前面に戻ったときを含む）は、最後に取ってから 30 分たった番組だけを取り直す。
 * 下に引っ張ったときと「フィードを更新」を押したときは、いつでも取り直す。
 * 取り直せなかったときは、前に読み込んだ内容を残し、番組ごとに理由を覚える（アプリの中だけ。保存しない）。
 */

/** 自動で取り直すまでの間隔（ミリ秒） */
export const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000

/** 最後に取ってきた時刻を保存するキー。値は番組 ID ごとの ISO 8601 の時刻 */
const FETCHED_AT_KEY = 'feedFetchedAt'

/** 番組ごとの取り直しの状態。成功したら消す */
export type RefreshStatus = { state: 'loading' } | { state: 'failed', message: string }

let statuses: Record<string, RefreshStatus> = {}
const running = new Map<string, Promise<boolean>>()
const listeners = new Set<() => void>()

/**
 * 番組の状態を変え、使っている画面に知らせる。
 * @param showId 番組 ID
 * @param status 新しい状態。undefined なら消す
 */
const setStatus = (showId: string, status: RefreshStatus | undefined) => {
  const { [showId]: _, ...rest } = statuses
  statuses = status ? { ...rest, [showId]: status } : rest
  listeners.forEach((l) => l())
}

/**
 * 番組を最後に取ってきた時刻を残す。追加したときと、取り直せたときに呼ぶ。
 * @param showId 番組 ID
 * @param at 時刻
 */
export const markFetched = (showId: string, at = new Date()) => {
  const all = loadValue<Record<string, string>>(FETCHED_AT_KEY) ?? {}
  saveValue(FETCHED_AT_KEY, { ...all, [showId]: at.toISOString() })
}

/**
 * 自動で取り直す頃合いか。一度も取っていない番組は頃合いとする。
 * @param showId 番組 ID
 * @param now いまの時刻
 * @returns 取り直すなら true
 */
const isDue = (showId: string, now: number) => {
  const at = loadValue<Record<string, string>>(FETCHED_AT_KEY)?.[showId]
  return !at || now - Date.parse(at) >= AUTO_REFRESH_INTERVAL_MS
}

/**
 * 番組のフィードを取り直す。同じ番組を取り直している最中なら、その結果を待つ。
 * @param showId 番組 ID
 * @param options.force 間隔を待たずに取り直すか（引っ張ったとき・押したとき）
 * @returns 取り直せたか。フィードのない番組と、間隔を待って取り直さなかったときは true
 */
export const refreshShow = (showId: string, { force = false } = {}): Promise<boolean> => {
  const show = findShow(showId)
  if (!show?.feedUrl) return Promise.resolve(true)
  const pending = running.get(showId)
  if (pending) return pending
  if (!force && !isDue(showId, Date.now())) return Promise.resolve(true)
  const { feedUrl } = show
  setStatus(showId, { state: 'loading' })
  const task = (async () => {
    try {
      // 番組 ID は最初に追加したときのものを使い、ID の元の URL（フィードの URL）が移転で変わっても揃える
      const fresh = await fetchFeed(feedUrl, undefined, idSourceOf(showId, feedUrl))
      mergeFeed(showId, fresh, fresh.newFeedUrl ?? feedUrl)
      if (fresh.newFeedUrl) rememberIdSource(showId, feedUrl)
      markFetched(showId)
      setStatus(showId, undefined)
      return true
    } catch (e) {
      setStatus(showId, { state: 'failed', message: refreshErrorMessage(e) })
      return false
    } finally {
      running.delete(showId)
    }
  })()
  running.set(showId, task)
  return task
}

/** 番組 ID を作った元の URL を保存するキー。移転した番組だけ持つ */
const ID_SOURCE_KEY = 'feedIdSource'

/**
 * 番組 ID を作った元の URL を返す。移転していなければ、いまのフィードの URL。
 * @param showId 番組 ID
 * @param feedUrl いまのフィードの URL
 * @returns 元の URL
 */
const idSourceOf = (showId: string, feedUrl: string) =>
  loadValue<Record<string, string>>(ID_SOURCE_KEY)?.[showId] ?? feedUrl

/**
 * 移転する前の URL を、番組 ID の元として覚える（すでに覚えていれば変えない）。
 * @param showId 番組 ID
 * @param feedUrl 移転する前のフィードの URL
 */
const rememberIdSource = (showId: string, feedUrl: string) => {
  const all = loadValue<Record<string, string>>(ID_SOURCE_KEY) ?? {}
  if (all[showId]) return
  saveValue(ID_SOURCE_KEY, { ...all, [showId]: feedUrl })
}

/**
 * 取り直す番組を選ぶ。フォロー中で非表示でなく、RSS で追加した番組。
 * @param followedShowIds フォロー中の番組 ID
 * @param hiddenShowIds 非表示の番組 ID
 * @returns 取り直す番組 ID
 */
export const feedShowIds = (followedShowIds: string[], hiddenShowIds: string[]) =>
  followedShowIds.filter((id) => !hiddenShowIds.includes(id) && !!findShow(id)?.feedUrl)

/**
 * いくつかの番組をまとめて取り直す。
 * @param showIds 番組 ID
 * @param options.force 間隔を待たずに取り直すか
 * @returns 取り直せなかった番組の数
 */
export const refreshShows = async (showIds: string[], options: { force?: boolean } = {}) => {
  const results = await Promise.all(showIds.map((id) => refreshShow(id, options)))
  return results.filter((ok) => !ok).length
}

onStorageCleared(() => {
  statuses = {}
  listeners.forEach((l) => l())
})

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
 * 番組の取り直しの状態を取り出し、変わったら描き直す。
 * @param showId 番組 ID
 * @returns 状態。取り直していない・成功したなら undefined
 */
export const useRefreshStatus = (showId: string) => useSyncExternalStore(subscribe, () => statuses[showId])

/**
 * 下に引っ張って更新するときの状態。更新が終わるまで refreshing を true にする。
 * @param run 更新する関数
 * @returns refreshing（更新中か）と onRefresh（引っ張ったときに呼ぶ関数）
 */
export const usePullRefresh = (run: () => Promise<unknown>) => {
  const [refreshing, setRefreshing] = useState(false)
  /** 引っ張ったときに呼ぶ */
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await run()
    } finally {
      setRefreshing(false)
    }
  }
  return { refreshing, onRefresh }
}
