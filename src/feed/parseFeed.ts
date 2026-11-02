import { XMLParser } from 'fast-xml-parser'

import type { Episode, Show } from '@/types'

/** フィードを取り込めなかった理由 */
export type FeedErrorKind = 'invalidUrl' | 'network' | 'http' | 'notFeed'

/** フィードを取り込めなかったことを表すエラー */
export class FeedError extends Error {
  kind: FeedErrorKind

  /**
   * @param kind 取り込めなかった理由
   * @param message 開発者向けの説明
   */
  constructor(kind: FeedErrorKind, message: string) {
    super(message)
    this.name = 'FeedError'
    this.kind = kind
  }
}

/** フィードから取り込んだ番組とエピソード */
export type ParsedFeed = { show: Show, episodes: Episode[] }

/** XML を読んだ結果の値。文字列、属性付きの要素、同じ名前の要素の並びのどれか */
type Node = string | number | boolean | { [key: string]: Node } | Node[] | undefined

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // 数字だけの値（ID や再生時間）も文字列のまま受け取る
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  htmlEntities: true,
  jPath: true,
  isArray: (_name, jPath) => jPath === 'rss.channel.item',
})

/** 子の要素や属性を持つ要素 */
type Element = { [key: string]: Node }

/**
 * 同じ名前の要素が並んでいたら、最初のものを返す。
 * @param node 値
 * @returns 最初の値
 */
const first = (node: Node): Node => (Array.isArray(node) ? node[0] : node)

/**
 * 値が子や属性を持つ要素なら、それを返す。
 * @param node 値
 * @returns 要素。要素でなければ undefined
 */
const element = (node: Node): Element | undefined => {
  const v = first(node)
  return v && typeof v === 'object' && !Array.isArray(v) ? v : undefined
}

/**
 * 要素の文字を取り出す。属性付きの要素なら、その中の文字を返す。
 * @param node 値
 * @returns 文字。なければ空文字
 */
const text = (node: Node): string => {
  const v = first(node)
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  const el = element(v)
  return el ? text(el['#text']) : ''
}

/**
 * 要素の属性を取り出す。
 * @param node 値
 * @param name 属性名
 * @returns 属性の値。なければ空文字
 */
const attr = (node: Node, name: string) => text(element(node)?.[`@_${name}`])

/** CDATA の中に残る、よく使われる文字参照 */
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/**
 * タグを取り除く。`<scr<b>ipt>` のような入れ子でタグが残らないよう、変わらなくなるまで繰り返す。
 * @param html HTML を含むかもしれない文字
 * @returns タグを除いた文字
 */
const stripTags = (html: string) => {
  let current = html
  let previous: string
  do {
    previous = current
    current = current.replace(/<[^>]*>/g, '')
  } while (current !== previous)
  return current
}

/**
 * HTML を含む紹介文を、表示用の文字だけにする。段落と改行は改行に直す。
 * 結果は Text にだけ表示し、HTML としては扱わない（文字参照を戻した「<」などは文字のまま出す）。
 * @param html HTML を含むかもしれない文字
 * @returns 文字だけにした文
 */
export const plainText = (html: string) =>
  stripTags(html.replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, '\n'))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()

/**
 * 文字列から短い ID を作る（32ビットの FNV-1a を36進数にしたもの）。
 * @param value 元の文字列
 * @returns ID
 */
export const hashId = (value: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/**
 * itunes:duration を秒にする。「1:02:03」「62:03」「3723」の形を受け付ける。
 * @param value 再生時間の文字
 * @returns 秒数。読めなければ 0
 */
export const parseDuration = (value: string) => {
  if (!/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(value)) return 0
  return Math.floor(value.split(':').reduce((sum, part) => sum * 60 + Number(part), 0))
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * RSS の日時（例: Wed, 29 Oct 2026 07:00:00 +0900）を日時に直す。読めなければ ISO 8601 として読む。
 * @param value 日時の文字
 * @returns 日時。読めなければ undefined
 */
const parseRssDate = (value: string) => {
  const m = /(\d{1,2})\s+([a-z]{3})[a-z]*\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4})?/i.exec(value)
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1
  if (!m || month < 0) {
    const t = Date.parse(value)
    return Number.isNaN(t) ? undefined : new Date(t)
  }
  const tz = m[7] ?? '+0000'
  const sign = tz.startsWith('-') ? -1 : 1
  const offset = sign * (Number(tz.slice(1, 3)) * 60 + Number(tz.slice(3)))
  const utc = Date.UTC(Number(m[3]), month, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0))
  return new Date(utc - offset * 60_000)
}

/**
 * 日時を、端末の時刻での「2026-10-29」の形にする。
 * @param date 日時
 * @returns 日付の文字
 */
const localDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')

/**
 * フィードの item をエピソードにする。
 * @param item item の要素
 * @param showId 番組 ID
 * @returns エピソード。タイトルも音声もない item は undefined
 */
const toEpisode = (item: Element, showId: string): Episode | undefined => {
  const title = plainText(text(item.title))
  const audioUrl = attr(item.enclosure, 'url') || undefined
  if (!title && !audioUrl) return undefined
  const pubDate = parseRssDate(text(item.pubDate))
  const key = text(item.guid) || audioUrl || `${title}${text(item.pubDate)}`
  return {
    id: `${showId}-${hashId(key)}`,
    showId,
    title: title || '（タイトルなし）',
    summary: plainText(text(item['itunes:summary']) || text(item.description)),
    publishedAt: pubDate ? localDate(pubDate) : '',
    duration: parseDuration(text(item['itunes:duration'])),
    audioUrl,
  }
}

/**
 * RSS フィードを読み、番組とエピソードにする。
 * @param xml フィードの中身
 * @param feedUrl フィードの URL（番組 ID を作るのに使う）
 * @returns 番組とエピソード
 * @throws FeedError（notFeed）RSS のフィードとして読めないとき
 */
export const parseFeed = (xml: string, feedUrl: string): ParsedFeed => {
  let doc: Node
  try {
    // 閉じていないタグなども誤りにするため、読む前に検証する
    doc = parser.parse(xml, true)
  } catch (e) {
    throw new FeedError('notFeed', `XML を読めません: ${String(e)}`)
  }
  const channel = element(element(element(doc)?.rss)?.channel)
  if (!channel) throw new FeedError('notFeed', 'RSS の channel がありません')
  const title = plainText(text(channel.title))
  if (!title) throw new FeedError('notFeed', '番組名がありません')
  const showId = `f${hashId(feedUrl)}`
  const items = Array.isArray(channel.item) ? channel.item : []
  const seen = new Set<string>()
  const episodes = items.flatMap((node) => {
    const item = element(node)
    const episode = item && toEpisode(item, showId)
    if (!episode || seen.has(episode.id)) return []
    seen.add(episode.id)
    return [episode]
  })
  const show: Show = {
    id: showId,
    title,
    publisher: plainText(text(channel['itunes:author']) || text(channel.managingEditor)),
    description: plainText(text(channel['itunes:summary']) || text(channel.description)),
    category: attr(channel['itunes:category'], 'text'),
    feedUrl,
  }
  return { show, episodes }
}
