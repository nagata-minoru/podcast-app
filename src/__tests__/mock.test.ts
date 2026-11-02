import { episodesOfShow, findEpisode, findShow } from '@/data/catalog'
import { episodes, library, progresses, shows } from '@/data/mock'

describe('架空データの整合性', () => {
  const showIds = shows.map((s) => s.id)
  const episodeIds = episodes.map((e) => e.id)

  it('番組とエピソードの ID が重複しない', () => {
    expect(new Set(showIds).size).toBe(showIds.length)
    expect(new Set(episodeIds).size).toBe(episodeIds.length)
  })

  it('エピソードはすべて存在する番組に属する', () => {
    episodes.forEach((e) => expect(showIds).toContain(e.showId))
  })

  it('再生位置と保存済みは、存在するエピソードだけを指す', () => {
    progresses.forEach((p) => expect(episodeIds).toContain(p.episodeId))
    library.savedEpisodeIds.forEach((id) => expect(episodeIds).toContain(id))
  })

  it('登録済みは、存在する番組だけを指す', () => {
    library.followedShowIds.forEach((id) => expect(showIds).toContain(id))
  })

  it('再生位置はエピソードの長さを超えない', () => {
    progresses.forEach((p) => {
      expect(p.position).toBeLessThanOrEqual(findEpisode(p.episodeId)?.duration ?? 0)
    })
  })

  it('人気順位は 1 から始まる重複のない連番', () => {
    const ranks = shows.map((s) => s.popularityRank ?? 0).sort((a, b) => a - b)
    expect(ranks).toEqual(shows.map((_, i) => i + 1))
  })
})

describe('検索用の関数', () => {
  it('findShow は ID で番組を返し、なければ undefined', () => {
    expect(findShow('s2')?.title).toBe('台所サイエンス')
    expect(findShow('none')).toBeUndefined()
  })

  it('findEpisode は ID でエピソードを返し、なければ undefined', () => {
    expect(findEpisode('e3')?.showId).toBe('s2')
    expect(findEpisode('none')).toBeUndefined()
  })

  it('episodesOfShow はその番組のエピソードを新しい順に返す', () => {
    const list = episodesOfShow('s1')
    expect(list.map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(list.every((e) => e.showId === 's1')).toBe(true)
  })

  it('episodesOfShow はエピソードのない番組で空の配列を返す', () => {
    expect(episodesOfShow('none')).toEqual([])
  })
})
