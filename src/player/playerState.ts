import type { Episode } from '@/types'

/** 再生の状態。idle のときはミニプレイヤーを出さない */
export type PlayerStatus = 'idle' | 'playing' | 'paused'

/** 再生状態の全体 */
export type PlayerState = {
  episode: Episode | null
  status: PlayerStatus
  /** 再生位置（秒） */
  position: number
  /** 再生時間（秒） */
  duration: number
  /** 再生速度（1 が等速） */
  rate: number
}

/** 再生状態を変える操作 */
export type PlayerAction =
  | { type: 'play', episode: Episode, position: number, rate: number }
  | { type: 'toggle' }
  | { type: 'seek', delta: number }
  | { type: 'seekTo', position: number }
  | { type: 'setRate', rate: number }
  | { type: 'tick', seconds: number }
  | { type: 'close' }

/** 戻る秒数 */
export const SKIP_BACK = 15
/** 進む秒数 */
export const SKIP_FORWARD = 30
/** 設定画面の再生速度が未実装のあいだ使う既定の速度 */
export const DEFAULT_RATE = 1
/** 再生速度ボタンで順に切り替える速度 */
export const RATES = [0.8, 1, 1.25, 1.5, 2] as const

/** 何も再生していない状態 */
export const initialPlayerState: PlayerState = {
  episode: null, status: 'idle', position: 0, duration: 0, rate: DEFAULT_RATE,
}

/**
 * 再生位置を 0 から再生時間までに収める。
 * @param position 再生位置（秒）
 * @param duration 再生時間（秒）
 * @returns 範囲内に収めた再生位置
 */
const clamp = (position: number, duration: number) => Math.min(Math.max(position, 0), duration)

/**
 * 再生位置を動かす。最後まで進んだら再生を終えて idle に戻す。
 * @param state 現在の状態
 * @param position 新しい再生位置（秒）
 * @returns 新しい状態
 */
const moveTo = (state: PlayerState, position: number): PlayerState => {
  if (state.status === 'idle') return state
  const next = clamp(position, state.duration)
  if (next >= state.duration) return initialPlayerState
  return { ...state, position: next }
}

/**
 * 再生状態の reducer。
 * @param state 現在の状態
 * @param action 操作
 * @returns 新しい状態
 */
export const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'play':
      // 同じ回を選び直したときは、位置を戻さずに再生を続ける
      if (state.episode?.id === action.episode.id && state.status !== 'idle') return { ...state, status: 'playing' }
      return {
        episode: action.episode, status: 'playing', duration: action.episode.duration,
        position: clamp(action.position, action.episode.duration), rate: action.rate,
      }
    case 'toggle':
      if (state.status === 'idle') return state
      return { ...state, status: state.status === 'playing' ? 'paused' : 'playing' }
    case 'seek':
      return moveTo(state, state.position + action.delta)
    case 'seekTo':
      return moveTo(state, action.position)
    case 'setRate':
      return { ...state, rate: action.rate }
    case 'tick':
      if (state.status !== 'playing') return state
      return moveTo(state, state.position + action.seconds * state.rate)
    case 'close':
      return initialPlayerState
  }
}

/**
 * 再生速度ボタンを押したときの次の速度を返す。一覧にない速度からは等速に戻す。
 * @param rate 現在の速度
 * @returns 次の速度
 */
export const nextRate = (rate: number) => {
  const i = RATES.findIndex((r) => r === rate)
  if (i < 0) return DEFAULT_RATE
  return RATES[(i + 1) % RATES.length]
}

/**
 * 再生速度を「1.25×」の形にする。
 * @param rate 速度
 * @returns 表示用の文字列
 */
export const formatRate = (rate: number) => `${Number.isInteger(rate) ? rate.toFixed(1) : rate}×`
