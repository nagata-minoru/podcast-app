/** 番組 */
export type Show = {
  id: string
  title: string
  publisher: string
  description: string
  category: string
  /** 更新の間隔（例: 毎週水曜）。フィードから取り込んだ番組にはない */
  updateFrequency?: string
  /** 全体の人気順。小さいほど人気（新着・おすすめの「トップ番組」に使う）。フィードから取り込んだ番組にはない */
  popularityRank?: number
  /** RSS フィードの URL。フィードから取り込んだ番組だけにある */
  feedUrl?: string
}

/** エピソード */
export type Episode = {
  id: string
  showId: string
  title: string
  summary: string
  /** 公開日（ISO 8601 の日付） */
  publishedAt: string
  /** 再生時間（秒）。フィードに書かれていなければ 0 で、音声を読み込んだら実際の長さに直す */
  duration: number
  /** 音声の URL。フィードから取り込んだエピソードだけにあり、フィードに音声がなければない */
  audioUrl?: string
}

/** エピソードごとの再生位置 */
export type Progress = {
  episodeId: string
  /** 再生位置（秒） */
  position: number
  completed: boolean
  /** 最終更新日時（ISO 8601） */
  updatedAt: string
}

/** 新着・おすすめの「注目の特集」。番組を1つ取り上げる */
export type Feature = {
  id: string
  showId: string
  title: string
  description: string
}

/** ライブラリの内容 */
export type Library = {
  followedShowIds: string[]
  savedEpisodeIds: string[]
}

/** 番組ごとの設定 */
export type ShowPreference = {
  showId: string
  /** 番組ごとの再生速度。未設定なら設定画面の速度を使う */
  rate?: number
  hidden: boolean
}

/** 下部4タブの名前（ルートのフォルダ名と一致させる） */
export type TabName = 'home' | 'discover' | 'library' | 'search'
