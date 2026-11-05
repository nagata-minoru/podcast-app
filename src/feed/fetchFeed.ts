import { FeedError, type ParsedFeed, parseFeed } from '@/feed/parseFeed'

/** フィードを待つ時間（ミリ秒） */
export const FEED_TIMEOUT_MS = 15_000

/**
 * 入力された文字を、フィードの URL として確かめる。前後の空白は除く。
 * @param input 入力された文字
 * @returns http か https の URL
 * @throws FeedError（invalidUrl）URL でないか、http・https 以外のとき
 */
export const normalizeFeedUrl = (input: string) => {
  const value = input.trim()
  if (!/^https?:\/\/[^\s/?#]+/i.test(value)) {
    throw new FeedError('invalidUrl', `http か https の URL ではありません: ${value}`)
  }
  return value
}

/**
 * RSS フィードを取ってきて、番組とエピソードにする。リダイレクトは fetch に任せ、番組 ID は入力した URL から作る。
 * @param input 入力されたフィードの URL
 * @param timeoutMs 待つ時間（ミリ秒）
 * @param idSource 番組 ID を作る元の URL（取り直しで ID を変えないため）。省略すると入力した URL
 * @returns 番組とエピソード
 * @throws FeedError URL の誤り（invalidUrl）、接続できない・時間切れ（network）、
 *   成功以外の応答（http）、RSS でない（notFeed）
 */
export const fetchFeed = async (
  input: string, timeoutMs = FEED_TIMEOUT_MS, idSource?: string,
): Promise<ParsedFeed> => {
  const url = normalizeFeedUrl(input)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    let response: Response
    try {
      response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/rss+xml, */*' } })
    } catch (e) {
      throw new FeedError('network', `フィードに接続できません: ${String(e)}`)
    }
    if (!response.ok) throw new FeedError('http', `フィードの応答が ${response.status} です`)
    let body: string
    try {
      body = await response.text()
    } catch (e) {
      throw new FeedError('network', `フィードを最後まで受け取れません: ${String(e)}`)
    }
    return parseFeed(body, url, idSource)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 取り込めなかった理由を、利用者向けの文にする。
 * @param error 起きたエラー
 * @returns 表示する文
 */
export const feedErrorMessage = (error: unknown) => {
  const kind = error instanceof FeedError ? error.kind : undefined
  if (kind === 'invalidUrl') return 'URL の形が正しくありません。http:// か https:// で始まる URL を入力してください。'
  if (kind === 'network') return 'フィードに接続できませんでした。通信状態を確かめて、もう一度お試しください。'
  if (kind === 'http') return 'フィードを取得できませんでした。URL が正しいか確かめてください。'
  if (kind === 'notFeed') return 'この URL は RSS フィードではないようです。番組の RSS の URL を入力してください。'
  return '番組を追加できませんでした。もう一度お試しください。'
}

/**
 * 取り直せなかった理由を、利用者向けの文にする（前に読み込んだ内容を表示し続ける前提の文）。
 * @param error 起きたエラー
 * @returns 表示する文
 */
export const refreshErrorMessage = (error: unknown) => {
  const kind = error instanceof FeedError ? error.kind : undefined
  if (kind === 'network') return 'フィードに接続できませんでした。通信状態を確かめてください。'
  if (kind === 'http' || kind === 'notFeed') {
    return 'フィードを取得できませんでした。配信が終わったか、フィードの URL が変わった可能性があります。'
  }
  return 'フィードを更新できませんでした。'
}
