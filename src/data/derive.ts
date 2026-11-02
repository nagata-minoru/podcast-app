import { episodes, findEpisode, shows } from '@/data/mock'
import type { Episode, Progress, Show } from '@/types'

/** 再生位置の記録と、それが指すエピソードの組 */
export type ProgressEntry = { progress: Progress, episode: Episode }

/**
 * 再生位置の記録に、エピソードを添える。存在しないエピソードの記録は除く。
 * @param history 再生位置の記録
 * @returns 記録とエピソードの組
 */
export const withEpisodes = (history: Progress[]): ProgressEntry[] =>
  history.flatMap((progress) => {
    const episode = findEpisode(progress.episodeId)
    return episode ? [{ progress, episode }] : []
  })

/**
 * 途中まで聴いたエピソードを、記録の順のまま返す。
 * @param history 新しい順の再生位置の記録
 * @returns 続きから再生に出す組
 */
export const inProgress = (history: Progress[]) => withEpisodes(history.filter((p) => !p.completed))

/**
 * 利用履歴（再生記録の件数）の多い順に番組を並べる。件数が同じなら、最近聴いた番組を先にする。
 * @param history 新しい順の再生位置の記録
 * @returns 「あなたのトップ番組」に出す番組
 */
export const topShowsByHistory = (history: Progress[]): Show[] => {
  const counts = new Map<string, number>()
  withEpisodes(history).forEach(({ episode }) => counts.set(episode.showId, (counts.get(episode.showId) ?? 0) + 1))
  const order = [...counts.keys()]
  return shows
    .filter((s) => counts.has(s.id))
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || order.indexOf(a.id) - order.indexOf(b.id))
}

/**
 * 番組のエピソードのうち、まだ一度も再生していない本数を数える。途中まで聴いた回は数えない。
 * @param showId 番組 ID
 * @param progress エピソードごとの再生位置の記録
 * @returns 未再生の本数
 */
export const unplayedCount = (showId: string, progress: Record<string, Progress>) =>
  episodes.filter((e) => e.showId === showId && !progress[e.id]).length
