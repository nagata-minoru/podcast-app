import { episodes } from '@/data/mock'
import { initialPlayerState, nextRate, playerReducer, type PlayerState } from '@/player/playerState'

const episode = episodes[0]

/**
 * 指定の位置から再生中の状態を作る。
 * @param position 再生位置（秒）
 * @param rate 再生速度
 * @returns 再生中の状態
 */
const playing = (position = 0, rate = 1): PlayerState => (
  playerReducer(initialPlayerState, { type: 'play', episode, position, rate })
)

describe('playerReducer', () => {
  it('play で再生中になり、再生時間と速度を受け取る', () => {
    const s = playing(100, 1.5)
    expect(s).toMatchObject({ status: 'playing', position: 100, duration: episode.duration, rate: 1.5 })
  })

  it('再生中の回を選び直しても位置を戻さない', () => {
    const paused = playerReducer(playing(300), { type: 'toggle' })
    const s = playerReducer(paused, { type: 'play', episode, position: 0, rate: 1 })
    expect(s).toMatchObject({ status: 'playing', position: 300 })
  })

  it('toggle で再生と一時停止を切り替え、idle では何もしない', () => {
    const paused = playerReducer(playing(), { type: 'toggle' })
    expect(paused.status).toBe('paused')
    expect(playerReducer(paused, { type: 'toggle' }).status).toBe('playing')
    expect(playerReducer(initialPlayerState, { type: 'toggle' })).toBe(initialPlayerState)
  })

  it('seek は 0 より前に戻らない', () => {
    expect(playerReducer(playing(10), { type: 'seek', delta: -15 }).position).toBe(0)
    expect(playerReducer(playing(10), { type: 'seek', delta: 30 }).position).toBe(40)
  })

  it('最後まで進むと再生を終えて idle に戻る', () => {
    expect(playerReducer(playing(episode.duration - 10), { type: 'seek', delta: 30 })).toBe(initialPlayerState)
    expect(playerReducer(playing(episode.duration - 1), { type: 'tick', seconds: 1 })).toBe(initialPlayerState)
  })

  it('tick は再生中だけ、速度の分だけ位置を進める', () => {
    expect(playerReducer(playing(0, 1.5), { type: 'tick', seconds: 1 }).position).toBe(1.5)
    const paused = playerReducer(playing(5), { type: 'toggle' })
    expect(playerReducer(paused, { type: 'tick', seconds: 1 })).toBe(paused)
  })

  it('close で idle に戻る', () => {
    expect(playerReducer(playing(), { type: 'close' })).toBe(initialPlayerState)
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
