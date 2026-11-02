/**
 * 秒数を「36分」「1時間2分」の形にする。1分に満たないときは「0分」にならないよう「20秒」の形にする（小数は切り上げ）。
 * @param seconds 秒数
 * @returns 読みやすい長さの文字列
 */
export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.max(0, Math.ceil(seconds))}秒`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}分`
  return `${Math.floor(minutes / 60)}時間${minutes % 60}分`
}

/**
 * ISO 8601 の日付を「10月29日」の形にする。
 * @param iso 日付文字列
 * @returns 月日の文字列
 */
export const formatDate = (iso: string) => {
  const [, month, day] = iso.slice(0, 10).split('-').map(Number)
  return `${month}月${day}日`
}

/**
 * 秒数を再生位置の表示「12:03」「1:02:05」の形にする。小数は切り捨てる。
 * @param seconds 秒数
 * @returns 時計の形の文字列
 */
export const formatClock = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  if (h === 0) return `${m}:${s}`
  return `${h}:${String(m).padStart(2, '0')}:${s}`
}

/**
 * 秒数を読み上げ用の「12分3秒」「1時間2分5秒」の形にする。
 * @param seconds 秒数
 * @returns 読み上げに向く文字列
 */
export const formatSpokenClock = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const text = `${Math.floor((total % 3600) / 60)}分${total % 60}秒`
  return h === 0 ? text : `${h}時間${text}`
}

/**
 * エピソードの長さを一覧向けに表す。長さがわからない（0 秒）ときは「長さ不明」にする。
 * @param seconds 再生時間（秒）
 * @returns 長さの文字列
 */
export const formatLength = (seconds: number) => (seconds > 0 ? formatDuration(seconds) : '長さ不明')
