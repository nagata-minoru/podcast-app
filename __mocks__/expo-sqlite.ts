// Jest 用の expo-sqlite の代わり。Node 組み込みの SQLite（node:sqlite）をメモリ上で使い、SQL はそのまま通す。
// 使う分だけ（openDatabaseSync と、その同期の操作）をまねる。テストのファイルごとに空のデータベースから始まる。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite')

type Param = string | number | null
type Params = Param[] | [Param[]]

/**
 * 可変長でも配列1つでも渡せる引数を、配列にそろえる。
 * @param params 引数
 * @returns 引数の配列
 */
const flat = (params: Params): Param[] => (Array.isArray(params[0]) ? params[0] : (params as Param[]))

/**
 * 行を普通のオブジェクトにする（node:sqlite はプロトタイプのないオブジェクトを返すため）。
 * @param row 行
 * @returns 普通のオブジェクト
 */
const plain = (row: unknown) => (row ? { ...(row as object) } : null)

/**
 * メモリ上のデータベースを開く。名前は区別しない。
 * @returns expo-sqlite の SQLiteDatabase の同期の操作をまねたもの
 */
export const openDatabaseSync = () => {
  const db = new DatabaseSync(':memory:')
  return {
    execSync: (source: string) => db.exec(source),
    runSync: (source: string, ...params: Params) => {
      const r = db.prepare(source).run(...flat(params))
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) }
    },
    getFirstSync: (source: string, ...params: Params) => plain(db.prepare(source).get(...flat(params))),
    getAllSync: (source: string, ...params: Params) => db.prepare(source).all(...flat(params)).map(plain),
    withTransactionSync: (task: () => void) => {
      db.exec('BEGIN')
      try {
        task()
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
  }
}
