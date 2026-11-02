import { type AudioStatus, setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import { type Dispatch, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { episodeAudio } from '@/data/audio'
import type { PlayerAction, PlayerState } from '@/player/playerState'

/** 音声の再生位置を知らせてもらう間隔（ミリ秒） */
const UPDATE_MS = 500

/**
 * 現在の日時を ISO 8601 で返す。
 * @returns 日時の文字列
 */
export const now = () => new Date().toISOString()

/**
 * 最新の値を持つ ref を返す。描画のあと、ほかの effect より先に書き換えるので、effect や操作の中で最新の値を読める。
 * @param value 持たせる値
 * @returns 最新の値を current に持つ ref
 */
export const useLatest = <T>(value: T) => {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}

/**
 * 再生状態（reducer）に合わせて expo-audio の音声を鳴らし、実際の再生位置を reducer に返す。
 * - 回が変わったら音声を差し替え、読み込めたら記録の位置へ移ってから鳴らす
 * - 再生・一時停止・速度は reducer の状態に合わせる
 * - 鳴っている間は再生位置を sync で、最後まで鳴ったら finish で、読み込めなければ fail で知らせる
 * @param state 再生状態
 * @param dispatch reducer の dispatch
 * @returns 音声の再生位置を動かす関数。reducer で位置を動かしたあとに呼ぶ。読み込み中なら、読み込み後に移る位置を変える
 */
export const useAudioEngine = (state: PlayerState, dispatch: Dispatch<PlayerAction>) => {
  const player = useAudioPlayer(null, { updateInterval: UPDATE_MS })
  /** 読み込み後に移る位置。読み込み中は位置の知らせを無視する */
  const pendingSeek = useRef<number | null>(null)
  /** 位置を動かしている途中か。途中は古い位置を知らせないよう無視する */
  const seeking = useRef(false)
  const stateRef = useLatest(state)
  const { status, rate, failed } = state
  const episodeId = state.status === 'idle' ? undefined : state.episode?.id

  /** 音声を鳴らす。速度は鳴らす直前に合わせる */
  const start = useCallback(() => {
    player.setPlaybackRate(stateRef.current.rate)
    player.play()
  }, [player, stateRef])

  const seekAudio = useCallback((position: number) => {
    seeking.current = true
    return player.seekTo(position).finally(() => {
      seeking.current = false
    })
  }, [player])

  const moveAudio = useCallback((position: number) => {
    if (pendingSeek.current !== null) {
      pendingSeek.current = position
      return
    }
    seekAudio(position).catch(() => dispatch({ type: 'fail' }))
  }, [seekAudio, dispatch])

  useEffect(() => {
    // 消音モードでも鳴らし、ほかのアプリの音とは混ぜない
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => {})
  }, [])

  useEffect(() => {
    /** 音声の状態の知らせを、reducer への操作に直す */
    const onStatus = (s: AudioStatus) => {
      if (s.error) return dispatch({ type: 'fail' })
      if (pendingSeek.current !== null) {
        if (!s.isLoaded) return
        const position = pendingSeek.current
        pendingSeek.current = null
        seekAudio(position).then(() => {
          if (stateRef.current.status === 'playing') start()
        }).catch(() => dispatch({ type: 'fail' }))
        return
      }
      if (s.didJustFinish) return dispatch({ type: 'finish', at: now() })
      if (!seeking.current && s.playing) dispatch({ type: 'sync', position: s.currentTime, at: now() })
    }
    const subscription = player.addListener('playbackStatusUpdate', onStatus)
    return () => subscription.remove()
  }, [player, dispatch, seekAudio, start, stateRef])

  useEffect(() => {
    if (!episodeId) {
      pendingSeek.current = null
      player.pause()
      return
    }
    const source = episodeAudio[episodeId]
    if (!source) return
    pendingSeek.current = stateRef.current.position
    player.replace(source)
  }, [episodeId, player, stateRef])

  useEffect(() => {
    if (!episodeId || pendingSeek.current !== null) return
    // 音声のない回は、鳴らさずに読み込めなかったことを知らせる（再生し直したときも同じ）
    if (status === 'playing' && !episodeAudio[episodeId]) dispatch({ type: 'fail' })
    else if (status === 'playing' && !failed) start()
    else player.pause()
  }, [episodeId, status, failed, rate, player, start, dispatch])

  return moveAudio
}
