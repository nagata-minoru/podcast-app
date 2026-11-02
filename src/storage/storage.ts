import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

import type { Episode, Progress, Show } from '@/types'

/**
 * 端末の中への保存（expo-sqlite）。アプリの外には送らない。
 * 保存がないものは、呼び出し側が架空のデータを初期値に使う。
 * 開けない・書けないときは、知らせを出してアプリの中だけで動き続ける（終了すると消える、いままでと同じ動き）。
 */

const DB_NAME = 'podcast.db'
/** 表の形の版。形を変えたら上げ、migrate に移し方を足す */
const SCHEMA_VERSION = 1

/** フィードから追加した番組と、そのエピソード */
export type SavedFeed = { show: Show, episodes: Episode[] }

let db: SQLiteDatabase | null | undefined
/** 再生位置の記録を一度でも保存したか。まだなら、最初の保存で全件を書く */
let progressSaved = false
const resetListeners = new Set<() => void>()

/**
 * 保存に失敗したことを開発者に知らせる。利用者の操作は止めない。
 * @param what 何をしようとしたか
 * @param error 起きたエラー
 */
const warn = (what: string, error: unknown) => {
  console.warn(`[storage] ${what}に失敗しました`, error)
}

/**
 * 表を作る。版が古ければ作り直す（版 1 が最初のため、いまは作るだけ）。
 * @param target 開いたデータベース
 */
const migrate = (target: SQLiteDatabase) => {
  const row = target.getFirstSync<{ user_version: number }>('PRAGMA user_version')
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) return
  target.execSync(`
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS feed_shows (
      id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, seq INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS feed_episodes (
      id TEXT PRIMARY KEY NOT NULL, show_id TEXT NOT NULL, position INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS feed_episodes_show ON feed_episodes (show_id);
    CREATE TABLE IF NOT EXISTS progress (
      episode_id TEXT PRIMARY KEY NOT NULL, position REAL NOT NULL, completed INTEGER NOT NULL,
      updated_at TEXT NOT NULL);
    PRAGMA user_version = ${SCHEMA_VERSION};
  `)
}

/**
 * データベースを開く（最初の1回だけ）。開けなければ null を覚え、以後は保存しない。
 * @returns データベース。開けなければ null
 */
const open = () => {
  if (db !== undefined) return db
  try {
    const opened = openDatabaseSync(DB_NAME)
    migrate(opened)
    db = opened
  } catch (e) {
    warn('データベースを開くの', e)
    db = null
  }
  return db
}

/**
 * データベースを使う処理を、失敗しても止まらないように包む。
 * @param what 何をするか（失敗の知らせに使う）
 * @param task 処理
 * @param fallback 開けない・失敗したときの値
 * @returns 処理の結果か fallback
 */
const withDb = <T>(what: string, task: (target: SQLiteDatabase) => T, fallback: T): T => {
  const target = open()
  if (!target) return fallback
  try {
    return task(target)
  } catch (e) {
    warn(what, e)
    return fallback
  }
}

/**
 * 保存した値を読む。
 * @param key キー
 * @returns 値。保存がない・読めないときは undefined
 */
export const loadValue = <T>(key: string): T | undefined =>
  withDb('読み込み', (target) => {
    const row = target.getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key)
    return row ? (JSON.parse(row.value) as T) : undefined
  }, undefined)

/**
 * 値を保存する。
 * @param key キー
 * @param value JSON にできる値
 */
export const saveValue = (key: string, value: unknown) => {
  withDb('保存', (target) => {
    target.runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, JSON.stringify(value))
  }, undefined)
}

/** 再生位置の記録の行 */
type ProgressRow = { episode_id: string, position: number, completed: number, updated_at: string }

/**
 * 再生位置の記録を読む。
 * @returns 記録。一度も保存していなければ undefined
 */
export const loadProgress = (): Progress[] | undefined =>
  withDb('再生位置の読み込み', (target) => {
    progressSaved = loadValue<boolean>('progressSaved') === true
    if (!progressSaved) return undefined
    return target.getAllSync<ProgressRow>('SELECT * FROM progress').map((r) => ({
      episodeId: r.episode_id, position: r.position, completed: r.completed === 1, updatedAt: r.updated_at,
    }))
  }, undefined)

/**
 * 再生位置の記録の変わった分を書く。最初の保存では全件を書く（架空のデータの記録を引き継ぐため）。
 * @param prev 前の記録
 * @param next 新しい記録
 */
export const saveProgress = (prev: Record<string, Progress>, next: Record<string, Progress>) => {
  withDb('再生位置の保存', (target) => {
    const base = progressSaved ? prev : {}
    target.withTransactionSync(() => {
      if (!progressSaved) target.runSync('DELETE FROM progress')
      Object.keys(base).filter((id) => !next[id]).forEach((id) => {
        target.runSync('DELETE FROM progress WHERE episode_id = ?', id)
      })
      Object.values(next).filter((p) => base[p.episodeId] !== p).forEach((p) => {
        target.runSync(
          'INSERT OR REPLACE INTO progress (episode_id, position, completed, updated_at) VALUES (?, ?, ?, ?)',
          p.episodeId, p.position, p.completed ? 1 : 0, p.updatedAt)
      })
      if (!progressSaved) target.runSync("INSERT OR REPLACE INTO kv (key, value) VALUES ('progressSaved', 'true')")
    })
    progressSaved = true
  }, undefined)
}

/**
 * フィードから追加した番組を、追加した順に読む。
 * @returns 番組とエピソード（エピソードはフィードの順）
 */
export const loadFeeds = (): SavedFeed[] =>
  withDb('番組の読み込み', (target) => {
    const shows = target.getAllSync<{ data: string }>('SELECT data FROM feed_shows ORDER BY seq')
    return shows.map((row) => {
      const show = JSON.parse(row.data) as Show
      const episodes = target.getAllSync<{ data: string }>(
        'SELECT data FROM feed_episodes WHERE show_id = ? ORDER BY position', show.id)
      return { show, episodes: episodes.map((e) => JSON.parse(e.data) as Episode) }
    })
  }, [])

/**
 * フィードから追加した番組を書く。同じ番組があれば、番組とエピソードを入れ替える（追加した順は保つ）。
 * @param show 番組
 * @param episodes その番組のエピソード
 */
export const saveFeed = (show: Show, episodes: Episode[]) => {
  withDb('番組の保存', (target) => {
    target.withTransactionSync(() => {
      // 新しい番組は最後の次の番号にし、すでにある番組は番号を変えずに中身だけ書き換える
      target.runSync(`
        INSERT INTO feed_shows (id, data, seq) VALUES (?, ?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM feed_shows))
        ON CONFLICT (id) DO UPDATE SET data = excluded.data`, show.id, JSON.stringify(show))
      target.runSync('DELETE FROM feed_episodes WHERE show_id = ?', show.id)
      episodes.forEach((e, i) => {
        target.runSync('INSERT OR REPLACE INTO feed_episodes (id, show_id, position, data) VALUES (?, ?, ?, ?)',
          e.id, show.id, i, JSON.stringify(e))
      })
    })
  }, undefined)
}

/**
 * フィードから追加したエピソードを書き直す（読み込んだ音声の長さを残すため）。架空のエピソードには何もしない。
 * @param episode エピソード
 */
export const saveFeedEpisode = (episode: Episode) => {
  withDb('エピソードの保存', (target) => {
    target.runSync('UPDATE feed_episodes SET data = ? WHERE id = ?', JSON.stringify(episode), episode.id)
  }, undefined)
}

/**
 * 保存したものをすべて消し、各 Provider とカタログに初期値へ戻るよう知らせる（開発中の E2E とテストで使う）。
 */
export const clearStorage = () => {
  withDb('削除', (target) => {
    target.execSync('DELETE FROM kv; DELETE FROM feed_shows; DELETE FROM feed_episodes; DELETE FROM progress;')
  }, undefined)
  progressSaved = false
  resetListeners.forEach((l) => l())
}

/**
 * 保存を消したときの知らせを受け取る。
 * @param listener 消したときに呼ぶ関数
 * @returns 受け取りをやめる関数
 */
export const onStorageCleared = (listener: () => void) => {
  resetListeners.add(listener)
  return () => {
    resetListeners.delete(listener)
  }
}
