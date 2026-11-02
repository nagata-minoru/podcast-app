import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

import { library, showPreferences } from '@/data/mock'

/** ライブラリと番組ごとの設定の状態と操作 */
export type LibraryState = {
  followedShowIds: string[]
  savedEpisodeIds: string[]
  hiddenShowIds: string[]
  /** 番組ごとの再生速度。ない番組は設定画面の速度を使う */
  showRates: Record<string, number>
  /** フォローしていればやめ、していなければフォローする */
  toggleFollow: (showId: string) => void
  /** フォローする（すでにフォロー中なら何もしない） */
  follow: (showId: string) => void
  /** フォローをやめる */
  unfollow: (showId: string) => void
  /** 保存済みなら外し、そうでなければ保存する */
  toggleSaved: (episodeId: string) => void
  /** 指定のエピソードを保存済みから外す */
  removeSaved: (episodeIds: string[]) => void
  /** 番組を非表示にし、フォローも解除する */
  hide: (showId: string) => void
  /** 非表示を解除する。フォローは戻さない */
  unhide: (showId: string) => void
  /** 番組ごとの再生速度を決める。undefined なら設定画面の速度に戻す */
  setShowRate: (showId: string, rate: number | undefined) => void
}

const LibraryContext = createContext<LibraryState | null>(null)

/**
 * 一覧に ID があれば外し、なければ末尾に加える。
 * @param ids ID の一覧
 * @param id 切り替える ID
 * @returns 新しい一覧
 */
export const toggleId = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])

/**
 * 一覧に ID がなければ末尾に加える。
 * @param ids ID の一覧
 * @param id 加える ID
 * @returns 新しい一覧
 */
const addId = (ids: string[], id: string) => (ids.includes(id) ? ids : [...ids, id])

/**
 * 番組ごとの再生速度を、初期データから作る。
 * @returns 番組 ID と速度の組
 */
const initialRates = () =>
  Object.fromEntries(showPreferences.flatMap((p) => (p.rate === undefined ? [] : [[p.showId, p.rate]])))

/**
 * フォロー中の番組、保存済みのエピソード、非表示の番組、番組ごとの速度を共有する。
 * 初期値は架空のデータで、終了すると元に戻る。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const [followedShowIds, setFollowed] = useState(library.followedShowIds)
  const [savedEpisodeIds, setSaved] = useState(library.savedEpisodeIds)
  const [hiddenShowIds, setHidden] = useState(() => showPreferences.filter((p) => p.hidden).map((p) => p.showId))
  const [showRates, setShowRates] = useState<Record<string, number>>(initialRates)
  const value = useMemo<LibraryState>(() => ({
    followedShowIds,
    savedEpisodeIds,
    hiddenShowIds,
    showRates,
    toggleFollow: (showId) => setFollowed((ids) => toggleId(ids, showId)),
    follow: (showId) => setFollowed((ids) => addId(ids, showId)),
    unfollow: (showId) => setFollowed((ids) => ids.filter((x) => x !== showId)),
    toggleSaved: (episodeId) => setSaved((ids) => toggleId(ids, episodeId)),
    removeSaved: (episodeIds) => setSaved((ids) => ids.filter((x) => !episodeIds.includes(x))),
    hide: (showId) => {
      setHidden((ids) => addId(ids, showId))
      setFollowed((ids) => ids.filter((x) => x !== showId))
    },
    unhide: (showId) => setHidden((ids) => ids.filter((x) => x !== showId)),
    setShowRate: (showId, rate) => setShowRates((rates) => {
      const { [showId]: _, ...rest } = rates
      return rate === undefined ? rest : { ...rest, [showId]: rate }
    }),
  }), [followedShowIds, savedEpisodeIds, hiddenShowIds, showRates])
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

/**
 * ライブラリの状態と操作を取り出す。
 * @returns ライブラリの状態と操作
 * @throws LibraryProvider の外で呼んだとき
 */
export const useLibrary = () => {
  const value = useContext(LibraryContext)
  if (!value) throw new Error('useLibrary は LibraryProvider の中で使ってください')
  return value
}

/**
 * 番組が非表示かどうかを調べる関数を返す。
 * @returns 番組 ID を受け取り、非表示なら true を返す関数
 */
export const useIsHidden = () => {
  const { hiddenShowIds } = useLibrary()
  return (showId: string) => hiddenShowIds.includes(showId)
}
