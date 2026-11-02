/**
 * 秒数を「36分」「1時間2分」の形にする。
 * @param seconds 秒数
 * @returns 読みやすい長さの文字列
 */
export const formatDuration = (seconds: number) => {
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
