import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from 'react'

import { progresses, showPreferences } from '@/data/mock'
import type { Episode } from '@/types'
import { DEFAULT_RATE, initialPlayerState, playerReducer, type PlayerState } from '@/player/playerState'

/** 画面から使う再生の操作 */
export type PlayerControls = {
  play: (episode: Episode) => void
  toggle: () => void
  seek: (delta: number) => void
  seekTo: (position: number) => void
  setRate: (rate: number) => void
  close: () => void
}

/** 再生位置を進める間隔（ミリ秒） */
const TICK_MS = 1000

const PlayerContext = createContext<(PlayerState & PlayerControls) | null>(null)

/**
 * 再生を始める位置を決める。途中まで聴いた回はその位置から、それ以外は最初から。
 * @param episode エピソード
 * @returns 開始位置（秒）
 */
export const startPosition = (episode: Episode) => {
  const p = progresses.find((x) => x.episodeId === episode.id)
  return p && !p.completed ? p.position : 0
}

/**
 * 再生を始める速度を決める。番組ごとの速度があればそれを、なければ既定の速度を使う。
 * 設定画面の再生速度は未実装のため、いまは既定の速度を設定画面の値の代わりにする。
 * @param episode エピソード
 * @returns 再生速度
 */
export const startRate = (episode: Episode) =>
  showPreferences.find((p) => p.showId === episode.showId)?.rate ?? DEFAULT_RATE

/**
 * 再生状態をアプリ全体で共有する。タブを切り替えても状態は保たれる。
 * 音声はまだ鳴らさず、再生中は1秒ごとに再生位置を速度の分だけ進める（模擬再生）。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState)

  useEffect(() => {
    if (state.status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'tick', seconds: TICK_MS / 1000 }), TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

  const controls = useMemo<PlayerControls>(() => ({
    play: (episode) => dispatch({ type: 'play', episode, position: startPosition(episode), rate: startRate(episode) }),
    toggle: () => dispatch({ type: 'toggle' }),
    seek: (delta) => dispatch({ type: 'seek', delta }),
    seekTo: (position) => dispatch({ type: 'seekTo', position }),
    setRate: (rate) => dispatch({ type: 'setRate', rate }),
    close: () => dispatch({ type: 'close' }),
  }), [])

  const value = useMemo(() => ({ ...state, ...controls }), [state, controls])
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
