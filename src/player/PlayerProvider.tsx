import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from 'react'

import { progresses } from '@/data/mock'
import { useLibrary } from '@/library/LibraryProvider'
import { initialPlayerState, playerReducer, type PlayerState, sortByRecent } from '@/player/playerState'
import { useSettings } from '@/settings/SettingsProvider'
import type { Episode, Progress } from '@/types'

/** 画面から使う再生の操作 */
export type PlayerControls = {
  play: (episode: Episode) => void
  toggle: () => void
  seek: (delta: number) => void
  seekTo: (position: number) => void
  setRate: (rate: number) => void
  close: () => void
  /** 指定のエピソードの再生位置の記録を消す */
  forget: (episodeIds: string[]) => void
}

/** 画面から使う再生の情報 */
export type PlayerValue = PlayerState & PlayerControls & {
  /** 再生位置の記録を、更新日時の新しい順に並べたもの */
  history: Progress[]
}

/** 再生位置を進める間隔（ミリ秒） */
const TICK_MS = 1000

const PlayerContext = createContext<PlayerValue | null>(null)

/**
 * 現在の日時を ISO 8601 で返す。
 * @returns 日時の文字列
 */
const now = () => new Date().toISOString()

/**
 * 再生状態をアプリ全体で共有する。タブを切り替えても状態は保たれる。
 * 音声はまだ鳴らさず、再生中は1秒ごとに再生位置を速度の分だけ進める（模擬再生）。
 * 再生位置の記録はアプリの中だけに持ち、終了すると架空のデータに戻る。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(playerReducer, progresses, initialPlayerState)
  const settingsRate = useSettings().rate
  const { showRates } = useLibrary()

  useEffect(() => {
    if (state.status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'tick', seconds: TICK_MS / 1000, at: now() }), TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

  const controls = useMemo<PlayerControls>(() => ({
    // 番組ごとの速度があればそれを、なければ設定画面の速度で始める
    play: (episode) => dispatch({ type: 'play', episode, rate: showRates[episode.showId] ?? settingsRate, at: now() }),
    toggle: () => dispatch({ type: 'toggle', at: now() }),
    seek: (delta) => dispatch({ type: 'seek', delta, at: now() }),
    seekTo: (position) => dispatch({ type: 'seekTo', position, at: now() }),
    setRate: (rate) => dispatch({ type: 'setRate', rate }),
    close: () => dispatch({ type: 'close', at: now() }),
    forget: (episodeIds) => dispatch({ type: 'forget', episodeIds }),
  }), [settingsRate, showRates])

  const history = useMemo(() => sortByRecent(state.progress), [state.progress])
  const value = useMemo(() => ({ ...state, ...controls, history }), [state, controls, history])
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

/**
 * 再生状態と操作を取り出す。
 * @returns 再生状態と操作
 * @throws PlayerProvider の外で呼んだとき
 */
export const usePlayer = () => {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer は PlayerProvider の中で使ってください')
  return value
}
