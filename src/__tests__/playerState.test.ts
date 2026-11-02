import { episodes } from '@/data/mock'
import {
  idleState, initialPlayerState, nextRate, playerReducer, type PlayerState, sortByRecent,
} from '@/player/playerState'
import type { Progress } from '@/types'

const episode = episodes[0]
const AT = '2026-11-02T10:00:00+09:00'
const LATER = '2026-11-02T10:05:00+09:00'

/**
 * 指定の位置から再生中の状態を作る。記録がなければ 0 から始まるため、seekTo で位置を合わせる。
 * @param position 再生位置（秒）
 * @param rate 再生速度
 * @returns 再生中の状態
 */
const playing = (position = 0, rate = 1): PlayerState => {
  const s = playerReducer(idleState(), { type: 'play', episode, rate, at: AT })
  return position === 0 ? s : playerReducer(s, { type: 'seekTo', position, at: AT })
}

describe('playerReducer', () => {
  it('play で再生中になり、再生時間と速度を受け取る', () => {
    const s = playing(100, 1.5)
    expect(s).toMatchObject({ status: 'playing', position: 100, duration: episode.duration, rate: 1.5 })
  })

  it('途中まで聴いた回は記録の位置から、再生済みの回は最初から始める', () => {
    const progress: Progress[] = [{
      episodeId: episode.id, position: 300, completed: false, updatedAt: AT,
    }]
    const resumed = playerReducer(initialPlayerState(progress), { type: 'play', episode, rate: 1, at: LATER })
    expect(resumed.position).toBe(300)
    const done = initialPlayerState([{ ...progress[0], completed: true }])
    expect(playerReducer(done, { type: 'play', episode, rate: 1, at: LATER }).position).toBe(0)
  })

  it('再生中の回を選び直しても位置を戻さない', () => {
    const paused = playerReducer(playing(300), { type: 'toggle', at: AT })
    const s = playerReducer(paused, { type: 'play', episode, rate: 1, at: AT })
    expect(s).toMatchObject({ status: 'playing', position: 300 })
  })

  it('toggle で再生と一時停止を切り替え、idle では何もしない', () => {
    const paused = playerReducer(playing(), { type: 'toggle', at: AT })
    expect(paused.status).toBe('paused')
    expect(playerReducer(paused, { type: 'toggle', at: AT }).status).toBe('playing')
    const idle = idleState()
    expect(playerReducer(idle, { type: 'toggle', at: AT })).toBe(idle)
  })

  it('seek は 0 より前に戻らない', () => {
    expect(playerReducer(playing(10), { type: 'seek', delta: -15, at: AT }).position).toBe(0)
    expect(playerReducer(playing(10), { type: 'seek', delta: 30, at: AT }).position).toBe(40)
  })

  it('位置が動くたびに、再生中の回の記録を更新日時とともに書き換える', () => {
    const s = playerReducer(playing(10), { type: 'seek', delta: 30, at: LATER })
    expect(s.progress[episode.id]).toEqual({ episodeId: episode.id, position: 40, completed: false, updatedAt: LATER })
  })

  it('最後まで進むと再生済みとして記録し、idle に戻る', () => {
    const s = playerReducer(playing(episode.duration - 10), { type: 'seek', delta: 30, at: LATER })
    expect(s).toMatchObject({ status: 'idle', episode: null })
    expect(s.progress[episode.id]).toMatchObject({ position: episode.duration, completed: true })
    const t = playerReducer(playing(episode.duration - 1), { type: 'tick', seconds: 1, at: LATER })
    expect(t.status).toBe('idle')
    expect(t.progress[episode.id].completed).toBe(true)
  })

  it('tick は再生中だけ、速度の分だけ位置を進める', () => {
    expect(playerReducer(playing(0, 1.5), { type: 'tick', seconds: 1, at: AT }).position).toBe(1.5)
    const paused = playerReducer(playing(5), { type: 'toggle', at: AT })
    expect(playerReducer(paused, { type: 'tick', seconds: 1, at: AT })).toBe(paused)
  })

  it('forget は指定の回の記録だけを消す', () => {
    const s = playerReducer(initialPlayerState([{
      episodeId: 'a', position: 1, completed: false, updatedAt: AT,
    }, {
      episodeId: 'b', position: 2, completed: true, updatedAt: AT,
    }]), { type: 'forget', episodeIds: ['a'] })
    expect(Object.keys(s.progress)).toEqual(['b'])
  })

  it('close で idle に戻り、閉じた位置を記録に残す', () => {
    const s = playerReducer(playing(120), { type: 'close', at: LATER })
    expect(s).toMatchObject({ status: 'idle', episode: null })
    expect(s.progress[episode.id]).toMatchObject({ position: 120, completed: false, updatedAt: LATER })
  })
})

describe('sortByRecent', () => {
  it('タイムゾーンの書き方が違っても、日時の新しい順に並べる', () => {
    const list = sortByRecent({
      a: { episodeId: 'a', position: 0, completed: false, updatedAt: '2026-11-01T21:10:00+09:00' },
      // 日本時間では 11月1日 22:00 で、a より新しい
      b: { episodeId: 'b', position: 0, completed: false, updatedAt: '2026-11-01T13:00:00.000Z' },
    })
    expect(list.map((p) => p.episodeId)).toEqual(['b', 'a'])
  })
})

describe('nextRate', () => {
  it('速度を順に切り替え、最後の次は最初に戻る', () => {
    expect(nextRate(1)).toBe(1.25)
    expect(nextRate(2)).toBe(0.8)
  })

  it('一覧にない速度からは等速に戻す', () => {
    expect(nextRate(1.1)).toBe(1)
  })
})
