// Jest 用の expo-audio の代わり。音は鳴らさず、再生中はタイマーで位置を速度の分だけ進める。
// 使う分だけ（useAudioPlayer、setAudioModeAsync、状態の知らせ）をまねる。
import { useEffect, useState } from 'react'

/** 位置を進めて状態を知らせる間隔（ミリ秒） */
const STEP_MS = 500
/** 代わりの音声の長さ（秒）。読み込んだ音声の長さは区別しない */
const FAKE_DURATION = 600

type Listener = (status: Record<string, unknown>) => void

/** 音を鳴らさない代わりのプレイヤー */
class FakeAudioPlayer {
  currentTime = 0
  playing = false
  playbackRate = 1
  isLoaded = false
  private listeners = new Set<Listener>()
  private timer: ReturnType<typeof setInterval> | null = null

  /**
   * 状態の知らせを受け取る。
   * @param _event イベント名（playbackStatusUpdate だけを扱う）
   * @param listener 受け取る関数
   * @returns 受け取りをやめるための remove を持つもの
   */
  addListener = (_event: string, listener: Listener) => {
    this.listeners.add(listener)
    return { remove: () => this.listeners.delete(listener) }
  }

  /**
   * 音声を差し替え、すぐに読み込み済みとして知らせる。
   * @param _source 音声
   */
  replace = (_source: unknown) => {
    this.stop()
    this.currentTime = 0
    this.isLoaded = true
    this.emit()
  }

  /** 再生を始める */
  play = () => {
    if (this.playing) return
    this.playing = true
    this.timer = setInterval(() => {
      this.currentTime = Math.min(this.currentTime + (STEP_MS / 1000) * this.playbackRate, FAKE_DURATION)
      this.emit(this.currentTime >= FAKE_DURATION)
    }, STEP_MS)
  }

  /** 一時停止する */
  pause = () => this.stop()

  /**
   * 位置を動かす。
   * @param seconds 新しい位置（秒）
   * @returns 動かし終えたら解決する Promise
   */
  seekTo = async (seconds: number) => {
    this.currentTime = seconds
  }

  /**
   * 再生速度を変える。
   * @param rate 速度
   */
  setPlaybackRate = (rate: number) => {
    this.playbackRate = rate
  }

  /** 後片付けする */
  remove = () => {
    this.stop()
    this.listeners.clear()
  }

  /** タイマーを止める */
  private stop = () => {
    this.playing = false
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /**
   * 状態を知らせる。
   * @param didJustFinish 最後まで鳴ったか
   */
  private emit = (didJustFinish = false) => {
    if (didJustFinish) this.stop()
    const status = {
      currentTime: this.currentTime, playing: this.playing, playbackRate: this.playbackRate,
      isLoaded: this.isLoaded, didJustFinish, error: null,
    }
    this.listeners.forEach((l) => l(status))
  }
}

/**
 * 代わりのプレイヤーを作り、画面を外すときに片付ける。
 * @returns プレイヤー
 */
export const useAudioPlayer = () => {
  const [player] = useState(() => new FakeAudioPlayer())
  useEffect(() => () => player.remove(), [player])
  return player
}

/**
 * 何もしない音声モードの設定。
 * @returns すぐ解決する Promise
 */
export const setAudioModeAsync = async () => {}
