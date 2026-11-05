import { episodes } from '@/data/mock'
import {
  inProgress, playStatusText, topShowsByHistory, unplayedCount, withEpisodes,
} from '@/data/derive'
import type { Progress } from '@/types'

/**
 * テスト用の再生位置の記録を作る。
 * @param episodeId エピソード ID
 * @param completed 最後まで聴いたか
 * @returns 再生位置の記録
 */
const p = (episodeId: string, completed = false): Progress => ({
  episodeId, position: 60, completed, updatedAt: '2026-11-02T10:00:00+09:00',
})

describe('再生位置の記録からの集計', () => {
  it('withEpisodes は存在しないエピソードの記録を除く', () => {
    expect(withEpisodes([p('e1'), p('none')]).map((x) => x.episode.id)).toEqual(['e1'])
  })

  it('inProgress は途中の回だけを、記録の順のまま返す', () => {
    expect(inProgress([p('e6'), p('e2', true), p('e3')]).map((x) => x.episode.id)).toEqual(['e6', 'e3'])
  })

  it('topShowsByHistory は記録の多い番組を先にし、同数なら最近聴いた番組を先にする', () => {
    // e1, e2 は s1、e3 は s2、e6 は s4
    expect(topShowsByHistory([p('e3'), p('e1'), p('e2')]).map((s) => s.id)).toEqual(['s1', 's2'])
    expect(topShowsByHistory([p('e6'), p('e3')]).map((s) => s.id)).toEqual(['s4', 's2'])
  })

  it('unplayedCount は一度も再生していない回だけを数える', () => {
    expect(unplayedCount('s1', {})).toBe(2)
    expect(unplayedCount('s1', { e2: p('e2', true) })).toBe(1)
    expect(unplayedCount('s1', { e1: p('e1'), e2: p('e2', true) })).toBe(0)
  })

  it('playStatusText は再生状況を記号付きの文にする', () => {
    const e3 = episodes.find((e) => e.id === 'e3')!
    expect(playStatusText(e3, undefined)).toBe('○ 未再生')
    expect(playStatusText(e3, { ...p('e3'), position: 40 })).toBe('残り52秒')
    expect(playStatusText(e3, { ...p('e3'), position: 80 })).toBe('残り12秒')
    expect(playStatusText(e3, p('e3', true))).toBe('✓ 再生済み')
  })
})
