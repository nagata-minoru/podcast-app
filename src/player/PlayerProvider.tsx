import { createContext, type ReactNode, useContext, useMemo, useReducer } from 'react'

import { progresses } from '@/data/mock'
import { useLibrary } from '@/library/LibraryProvider'
import { clamp, initialPlayerState, playerReducer, type PlayerState, sortByRecent } from '@/player/playerState'
import { now, useAudioEngine, useLatest } from '@/player/useAudioEngine'
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

const PlayerContext = createContext<PlayerValue | null>(null)

/**
 * 再生状態をアプリ全体で共有する。タブを切り替えても状態は保たれる。
 * 音声は expo-audio で鳴らし（useAudioEngine）、実際の再生位置を状態に返す。
 * 再生位置の記録はアプリの中だけに持ち、終了すると架空のデータに戻る。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(playerReducer, progresses, initialPlayerState)
  const settingsRate = useSettings().rate
  const { showRates } = useLibrary()
  const moveAudio = useAudioEngine(state, dispatch)
  const stateRef = useLatest(state)

  const controls = useMemo<PlayerControls>(() => {
    /** 状態の位置を動かし、最後まで行かなければ音声の位置も動かす（最後まで行くと再生済みになり止まる） */
    const seekBoth = (position: number) => {
      const { status, duration } = stateRef.current
      dispatch({ type: 'seekTo', position, at: now() })
      const target = clamp(position, duration)
      if (status !== 'idle' && target < duration) moveAudio(target)
    }
    return {
      // 番組ごとの速度があればそれを、なければ設定画面の速度で始める
      play: (episode) => {
        dispatch({ type: 'play', episode, rate: showRates[episode.showId] ?? settingsRate, at: now() })
      },
      toggle: () => dispatch({ type: 'toggle', at: now() }),
      seek: (delta) => seekBoth(stateRef.current.position + delta),
      seekTo: seekBoth,
      setRate: (rate) => dispatch({ type: 'setRate', rate }),
      close: () => dispatch({ type: 'close', at: now() }),
      forget: (episodeIds) => dispatch({ type: 'forget', episodeIds }),
    }
  }, [settingsRate, showRates, moveAudio, stateRef])

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
