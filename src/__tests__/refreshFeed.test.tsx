import { act, fireEvent } from '@testing-library/react-native'
import { renderRouter, screen } from 'expo-router/testing-library'

import { addShow, episodesOfShow, findShow, setEpisodeDuration } from '@/data/catalog'
import { library } from '@/data/mock'
import { parseFeed } from '@/feed/parseFeed'
import { AUTO_REFRESH_INTERVAL_MS, markFetched, refreshShow, refreshShows } from '@/feed/refreshFeeds'
import { saveValue } from '@/storage/storage'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'
const FEED_URL = 'https://feeds.example.test/refresh.xml'
const MOVED_URL = 'https://feeds.example.test/moved.xml'

/**
 * 架空の番組の回。
 * @param n 回の番号
 * @param duration itunes:duration に書く長さ。省略すると書かない
 * @returns item 要素
 */
const item = (n: number, duration?: string) => `
    <item>
      <title>第${n}回 取り直しの確認</title>
      <guid>refresh-${n}</guid>
      <pubDate>Mon, 0${n} Nov 2026 03:00:00 +0000</pubDate>
      <enclosure url="https://media.example.test/refresh-${n}.mp3" type="audio/mpeg" length="1" />
      ${duration ? `<itunes:duration>${duration}</itunes:duration>` : ''}
    </item>`

/**
 * 架空の番組のフィード。
 * @param items item 要素
 * @param extra channel に足す要素
 * @returns フィードの XML
 */
const feed = (items: string[], extra = '') => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>取り直しラジオ</title>
    <itunes:author>架空の放送室</itunes:author>
    <description>取り直しを確かめるための架空の番組です。</description>
    ${extra}
    ${items.join('')}
  </channel>
</rss>`

const fetchMock = jest.fn()

/**
 * fetch の応答を作る。
 * @param body 本文
 * @param status 状態コード
 * @returns 応答に見えるもの
 */
const respond = (body: string, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => body })

/**
 * 第1回・第2回だけの番組を、前に追加したものとして入れる。
 * @returns 番組 ID
 */
const addInitial = () => {
  const { show, episodes } = parseFeed(feed([item(1), item(2)]), FEED_URL)
  addShow(show, episodes)
  return show.id
}

beforeEach(() => {
  fetchMock.mockReset()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

describe('フィードの取り直し', () => {
  it('新しい回を足し、フィードから消えた回と、読み込んだ音声の長さを残す', async () => {
    const id = addInitial()
    const [second, first] = episodesOfShow(id)
    setEpisodeDuration(first.id, 300)
    fetchMock.mockResolvedValue(respond(feed([item(3, '10:00'), item(2)])))
    expect(await refreshShow(id, { force: true })).toBe(true)
    const titles = episodesOfShow(id).map((e) => e.title)
    expect(titles).toEqual(['第3回 取り直しの確認', '第2回 取り直しの確認', '第1回 取り直しの確認'])
    expect(episodesOfShow(id)[2]).toMatchObject({ id: first.id, duration: 300 })
    expect(episodesOfShow(id)[1].id).toBe(second.id)
    expect(episodesOfShow(id)[0].duration).toBe(600)
  })

  it('移転先が書かれていれば、番組 ID を変えずにフィードの URL を移す', async () => {
    const id = addInitial()
    const moved = `<itunes:new-feed-url>${MOVED_URL}</itunes:new-feed-url>`
    fetchMock.mockResolvedValueOnce(respond(feed([item(1), item(2)], moved)))
    await refreshShow(id, { force: true })
    expect(findShow(id)?.feedUrl).toBe(MOVED_URL)
    fetchMock.mockResolvedValueOnce(respond(feed([item(1), item(2), item(3)])))
    await refreshShow(id, { force: true })
    expect(fetchMock).toHaveBeenLastCalledWith(MOVED_URL, expect.anything())
    // 移転先から取り直しても、同じ番組の回として増える
    expect(episodesOfShow(id)).toHaveLength(3)
  })

  it('取り直せなければ、前に読み込んだ内容を残して失敗を返す', async () => {
    const id = addInitial()
    fetchMock.mockResolvedValue(respond('not found', 404))
    expect(await refreshShows([id], { force: true })).toBe(1)
    expect(episodesOfShow(id)).toHaveLength(2)
  })

  it('自動では、最後に取ってから 30 分たつまで取り直さない。引っ張ったときは取り直す', async () => {
    const id = addInitial()
    fetchMock.mockResolvedValue(respond(feed([item(1), item(2)])))
    markFetched(id, new Date(Date.now() - AUTO_REFRESH_INTERVAL_MS + 60_000))
    await refreshShow(id)
    expect(fetchMock).not.toHaveBeenCalled()
    await refreshShow(id, { force: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    markFetched(id, new Date(Date.now() - AUTO_REFRESH_INTERVAL_MS))
    await refreshShow(id)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('同じ番組を取り直している最中なら、もう一度は取りに行かない', async () => {
    const id = addInitial()
    fetchMock.mockResolvedValue(respond(feed([item(1), item(2)])))
    await Promise.all([refreshShow(id, { force: true }), refreshShow(id, { force: true })])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('フィードの取り直し（画面）', () => {
  // renderRouter は偽のタイマーに切り替えるため、ほかのテストに残さないよう戻す
  afterEach(() => jest.useRealTimers())

  /** fetch と本文の受け取りの Promise を進める */
  const settle = () => act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve()
  })

  it('アプリを開くと、フォロー中の RSS の番組を取り直す', async () => {
    const id = addInitial()
    saveValue('followedShowIds', [...library.followedShowIds, id])
    fetchMock.mockResolvedValue(respond(feed([item(1), item(2), item(3)])))
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await settle()
    expect(fetchMock).toHaveBeenCalledWith(FEED_URL, expect.anything())
    expect(episodesOfShow(id)).toHaveLength(3)
  })

  it('番組詳細の「⋯」から取り直し、失敗したら前の内容と理由を出す', async () => {
    const id = addInitial()
    markFetched(id)
    await renderRouter(APP_DIR, { initialUrl: `/library/show/${id}` })
    expect(screen.getByText('エピソード（2本）')).toBeOnTheScreen()

    fetchMock.mockResolvedValue(respond(feed([item(1), item(2), item(3)])))
    await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
    await fireEvent.press(screen.getByText('フィードを更新'))
    await settle()
    expect(screen.getByText('エピソード（3本）')).toBeOnTheScreen()

    fetchMock.mockRejectedValue(new Error('offline'))
    await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
    await fireEvent.press(screen.getByText('フィードを更新'))
    await settle()
    expect(screen.getByText(/フィードを更新できませんでした。前に読み込んだ内容を表示しています。/)).toBeOnTheScreen()
    expect(screen.getByText(/通信状態を確かめてください/)).toBeOnTheScreen()
    expect(screen.getByText('エピソード（3本）')).toBeOnTheScreen()
  })

  it('架空のデータの番組には「フィードを更新」を出さない', async () => {
    await renderRouter(APP_DIR, { initialUrl: `/library/show/${library.followedShowIds[0]}` })
    await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
    expect(screen.queryByText('フィードを更新')).toBeNull()
  })
})
