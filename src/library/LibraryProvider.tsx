import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

import { library } from '@/data/mock'

/** ライブラリの状態と操作 */
export type LibraryState = {
  followedShowIds: string[]
  savedEpisodeIds: string[]
  /** フォローしていればやめ、していなければフォローする */
  toggleFollow: (showId: string) => void
  /** 保存済みなら外し、そうでなければ保存する */
  toggleSaved: (episodeId: string) => void
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
 * フォロー中の番組と保存済みのエピソードを共有する。初期値は架空のデータで、終了すると元に戻る。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const [followedShowIds, setFollowed] = useState(library.followedShowIds)
  const [savedEpisodeIds, setSaved] = useState(library.savedEpisodeIds)
  const value = useMemo<LibraryState>(() => ({
    followedShowIds,
    savedEpisodeIds,
    toggleFollow: (showId) => setFollowed((ids) => toggleId(ids, showId)),
    toggleSaved: (episodeId) => setSaved((ids) => toggleId(ids, episodeId)),
  }), [followedShowIds, savedEpisodeIds])
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
