import type { Episode, Progress } from '@/types'

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
  /** エピソードごとの再生位置。再生位置が動くたびに、再生中の回の記録を書き換える */
  progress: Record<string, Progress>
}

/** 再生状態を変える操作。at は操作した日時（ISO 8601）で、再生位置の記録の更新日時に使う */
export type PlayerAction =
  | { type: 'play', episode: Episode, rate: number, at: string }
  | { type: 'toggle', at: string }
  | { type: 'seek', delta: number, at: string }
  | { type: 'seekTo', position: number, at: string }
  | { type: 'setRate', rate: number }
  | { type: 'tick', seconds: number, at: string }
  | { type: 'close', at: string }

/** 戻る秒数 */
export const SKIP_BACK = 15
/** 進む秒数 */
export const SKIP_FORWARD = 30
/** 設定画面で速度を選ぶ前の既定の速度 */
export const DEFAULT_RATE = 1
/** 再生速度ボタンで順に切り替える速度 */
export const RATES = [0.8, 1, 1.25, 1.5, 2] as const

/**
 * 何も再生していない状態を作る。
 * @param progress 引き継ぐ再生位置の記録
 * @returns idle の状態
 */
export const idleState = (progress: Record<string, Progress> = {}): PlayerState => ({
  episode: null, status: 'idle', position: 0, duration: 0, rate: DEFAULT_RATE, progress,
})

/**
 * 再生位置の記録の一覧から、初期状態を作る。
 * @param progresses 再生位置の記録
 * @returns idle の状態
 */
export const initialPlayerState = (progresses: Progress[]) =>
  idleState(Object.fromEntries(progresses.map((p) => [p.episodeId, p])))

/**
 * 再生位置を 0 から再生時間までに収める。
 * @param position 再生位置（秒）
 * @param duration 再生時間（秒）
 * @returns 範囲内に収めた再生位置
 */
const clamp = (position: number, duration: number) => Math.min(Math.max(position, 0), duration)

/**
 * 再生中の回の記録を書き換えた記録の一覧を返す。
 * @param state 現在の状態（episode があること）
 * @param position 記録する再生位置（秒）
 * @param completed 最後まで再生したか
 * @param at 更新日時
 * @returns 新しい記録の一覧
 */
const record = (state: PlayerState, position: number, completed: boolean, at: string) => {
  if (!state.episode) return state.progress
  const episodeId = state.episode.id
  return { ...state.progress, [episodeId]: { episodeId, position, completed, updatedAt: at } }
}

/**
 * 再生位置を動かす。最後まで進んだら再生済みとして記録し、idle に戻す。
 * @param state 現在の状態
 * @param position 新しい再生位置（秒）
 * @param at 操作した日時
 * @returns 新しい状態
 */
const moveTo = (state: PlayerState, position: number, at: string): PlayerState => {
  if (state.status === 'idle') return state
  const next = clamp(position, state.duration)
  if (next >= state.duration) return idleState(record(state, state.duration, true, at))
  return { ...state, position: next, progress: record(state, next, false, at) }
}

/**
 * 回を選んで再生を始める。途中まで聴いた回は記録の位置から、それ以外は最初から始める。
 * 同じ回を選び直したときは、位置を戻さずに再生を続ける。
 * @param state 現在の状態
 * @param action play の操作
 * @returns 新しい状態
 */
const play = (state: PlayerState, action: Extract<PlayerAction, { type: 'play' }>): PlayerState => {
  const { episode, rate, at } = action
  if (state.episode?.id === episode.id && state.status !== 'idle') return { ...state, status: 'playing' }
  const saved = state.progress[episode.id]
  const position = saved && !saved.completed ? clamp(saved.position, episode.duration) : 0
  const base: PlayerState = { episode, status: 'playing', duration: episode.duration, position, rate, progress: {} }
  return { ...base, progress: record({ ...base, progress: state.progress }, position, false, at) }
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
      return play(state, action)
    case 'toggle':
      if (state.status === 'idle') return state
      return {
        ...state, status: state.status === 'playing' ? 'paused' : 'playing',
        progress: record(state, state.position, false, action.at),
      }
    case 'seek':
      return moveTo(state, state.position + action.delta, action.at)
    case 'seekTo':
      return moveTo(state, action.position, action.at)
    case 'setRate':
      return { ...state, rate: action.rate }
    case 'tick':
      if (state.status !== 'playing') return state
      return moveTo(state, state.position + action.seconds * state.rate, action.at)
    case 'close':
      if (state.status === 'idle') return state
      return idleState(record(state, state.position, false, action.at))
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

/**
 * 記録を更新日時の新しい順に並べる。タイムゾーンの書き方が違っても正しく比べるため、日時に直して比べる。
 * @param progress 再生位置の記録
 * @returns 新しい順の記録
 */
export const sortByRecent = (progress: Record<string, Progress>) =>
  Object.values(progress).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
