import type { Episode, Library, Progress, Show, ShowPreference } from '@/types'

// すべて架空のデータ。実在する番組名・配信者名は使わない。

export const shows: Show[] = [{
  id: 's1', title: '朝の余白ラジオ', publisher: '余白制作室',
  description: '出勤前の15分で、気になったニュースと暮らしの話をゆるく話す番組です。',
  category: 'ニュース', updateFrequency: '毎週月・木', popularityRank: 2,
}, {
  id: 's2', title: '台所サイエンス', publisher: 'ことこと研究会',
  description: '料理の「なぜ」を化学と物理でひもとく、台所発の科学番組です。',
  category: '科学', updateFrequency: '毎週水曜', popularityRank: 1,
}, {
  id: 's3', title: '小さな会社の帳簿', publisher: '架空商店',
  description: '小さな会社を営む二人が、お金と仕事の実際を話します。',
  category: 'ビジネス', updateFrequency: '隔週金曜', popularityRank: 4,
}, {
  id: 's4', title: '夜ふかし雑談所', publisher: 'ねむれない二人',
  description: '眠れない夜に、取りとめのない話をだらだら続ける雑談番組です。',
  category: 'コメディ', updateFrequency: '不定期', popularityRank: 3,
}]

export const episodes: Episode[] = [{
  id: 'e1', showId: 's1', title: '#42 雨の日の通勤を楽しくする方法', summary: '傘と音楽と寄り道の話。',
  publishedAt: '2026-10-29', duration: 1820,
}, {
  id: 'e2', showId: 's1', title: '#41 秋の新しい習慣', summary: '朝の散歩を始めて3週間。',
  publishedAt: '2026-10-26', duration: 1640,
}, {
  id: 'e3', showId: 's2', title: '第18回 卵はなぜ固まるのか', summary: 'たんぱく質の変性を目玉焼きで。',
  publishedAt: '2026-10-28', duration: 2172,
}, {
  id: 'e4', showId: 's2', title: '第17回 だしのうま味の正体', summary: 'グルタミン酸とイノシン酸の相乗効果。',
  publishedAt: '2026-10-21', duration: 2010,
}, {
  id: 'e5', showId: 's3', title: '第9回 はじめての決算', summary: '数字が合わない夜の話。',
  publishedAt: '2026-10-24', duration: 2700,
}, {
  id: 'e6', showId: 's4', title: 'その31 自販機の新商品について', summary: '30分かけて結論が出ない。',
  publishedAt: '2026-10-30', duration: 3120,
}]

export const progresses: Progress[] = [{
  episodeId: 'e3', position: 600, completed: false, updatedAt: '2026-11-01T21:10:00+09:00',
}, {
  episodeId: 'e2', position: 1640, completed: true, updatedAt: '2026-10-30T07:40:00+09:00',
}, {
  episodeId: 'e6', position: 420, completed: false, updatedAt: '2026-10-31T23:55:00+09:00',
}]

export const library: Library = {
  followedShowIds: ['s1', 's2'],
  savedEpisodeIds: ['e5'],
}

export const showPreferences: ShowPreference[] = []

/**
 * ID から番組を探す。
 * @param id 番組 ID
 * @returns 番組。見つからなければ undefined
 */
export const findShow = (id: string) => shows.find((s) => s.id === id)

/**
 * ID からエピソードを探す。
 * @param id エピソード ID
 * @returns エピソード。見つからなければ undefined
 */
export const findEpisode = (id: string) => episodes.find((e) => e.id === id)

/**
 * 番組のエピソードを新しい順に返す。
 * @param showId 番組 ID
 * @returns 公開日の新しい順に並べたエピソード
 */
export const episodesOfShow = (showId: string) =>
  episodes.filter((e) => e.showId === showId).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
