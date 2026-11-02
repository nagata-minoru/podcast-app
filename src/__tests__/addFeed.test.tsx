import { act, fireEvent } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderRouter, screen } from 'expo-router/testing-library'

import { addShow, findEpisode, getCatalog, resetCatalog, setEpisodeDuration } from '@/data/catalog'
import { fetchFeed } from '@/feed/fetchFeed'
import type { Episode, Show } from '@/types'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'
const FEED_URL = 'https://feeds.example.test/trial.xml'

/** 架空の番組のフィード。2回目には音声がない */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>試し聴きラジオ</title>
    <itunes:author>架空の放送室</itunes:author>
    <description>動作確認のための架空の番組です。</description>
    <item>
      <title>第1回 はじめまして</title>
      <guid>trial-1</guid>
      <pubDate>Mon, 26 Oct 2026 03:00:00 +0000</pubDate>
      <enclosure url="https://media.example.test/trial-1.mp3" type="audio/mpeg" length="1" />
    </item>
    <item>
      <title>第2回 音声の準備中</title>
      <guid>trial-2</guid>
      <pubDate>Tue, 27 Oct 2026 03:00:00 +0000</pubDate>
      <itunes:duration>12:00</itunes:duration>
    </item>
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
 * 追加画面を開き、URL を入れて「追加」を押す。
 * @param url 入れる URL
 */
const submit = async (url: string) => {
  await renderRouter(APP_DIR, { initialUrl: '/search' })
  await fireEvent.press(screen.getByText('＋ RSS の URL で追加'))
  await fireEvent.changeText(screen.getByLabelText('RSS フィードの URL'), url)
  await fireEvent.press(screen.getByRole('button', { name: '追加' }))
  // フィードの読み込み（fetch、本文の受け取り、画面の置き換え）の Promise を進める
  await act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve()
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

describe('RSS の URL で追加（画面）', () => {
  // renderRouter は偽のタイマーに切り替えるため、ほかのテストに残さないよう戻す
  afterEach(() => jest.useRealTimers())

  it('読み込めたら番組を加えてフォローし、番組詳細に置き換える。戻ると検索に戻る', async () => {
    fetchMock.mockResolvedValue(respond(FEED))
    await submit(`  ${FEED_URL} `)
    expect(fetchMock).toHaveBeenCalledWith(FEED_URL, expect.anything())
    expect(await screen.findByText('試し聴きラジオ')).toBeOnTheScreen()
    expect(screen.getByText('✓ フォロー中')).toBeOnTheScreen()
    expect(screen.getByText('エピソード（2本）')).toBeOnTheScreen()
    // 長さのない回は「長さ不明」、音声のない回は「音声なし」にして押せないようにする
    expect(screen.getByText(/長さ不明/)).toBeOnTheScreen()
    expect(screen.getByText(/音声なし/)).toBeOnTheScreen()
    expect(screen.getByLabelText('第2回 音声の準備中を再生')).toBeDisabled()
    await act(async () => router.back())
    expect(screen.getByLabelText('番組・エピソード・テーマを検索')).toBeOnTheScreen()
    // 追加した番組は検索でも見つかる
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '試し聴き')
    expect(screen.getByText('試し聴きラジオ')).toBeOnTheScreen()
  })

  it('フィードの音声を再生し、読み込んだ長さを一覧にも反映する', async () => {
    fetchMock.mockResolvedValue(respond(FEED))
    await submit(FEED_URL)
    await screen.findByText('試し聴きラジオ')
    await fireEvent.press(screen.getByLabelText('第1回 はじめましてを再生'))
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    // 代わりのプレイヤーは URL の音声を 600 秒として知らせる
    expect(screen.getAllByText(/10分/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/長さ不明/)).toBeNull()
  })

  it.each([
    ['URL でないもの', 'feeds.example.test/trial.xml', undefined, /URL の形が正しくありません/],
    ['接続できない', FEED_URL, () => Promise.reject(new TypeError('Network request failed')), /接続できませんでした/],
    ['成功以外の応答', FEED_URL, () => Promise.resolve(respond('not found', 404)), /取得できませんでした/],
    ['RSS でない', FEED_URL, () => Promise.resolve(respond('<html><body>x</body></html>')), /RSS フィードではない/],
  ])('%s ときは理由を出し、画面にとどまる', async (_name, url, impl, message) => {
    if (impl) fetchMock.mockImplementation(impl)
    await submit(url)
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('RSS フィードの URL')).toBeOnTheScreen()
    if (!impl) expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('fetchFeed', () => {
  it('時間がかかりすぎたら打ち切り、network にする', async () => {
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')))
    }))
    await expect(fetchFeed(FEED_URL, 10)).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('catalog', () => {
  const show: Show = { id: 'fx', title: '架空', publisher: '', description: '', category: '', feedUrl: FEED_URL }
  const episode: Episode = { id: 'fx-1', showId: 'fx', title: '回', summary: '', publishedAt: '', duration: 0 }

  it('同じ番組を加え直すと、番組とエピソードを入れ替える', () => {
    addShow(show, [episode])
    addShow({ ...show, title: '架空2' }, [{ ...episode, id: 'fx-2' }])
    const { shows, episodes } = getCatalog()
    expect(shows.filter((s) => s.id === 'fx').map((s) => s.title)).toEqual(['架空2'])
    expect(episodes.filter((e) => e.showId === 'fx').map((e) => e.id)).toEqual(['fx-2'])
  })

  it('再生時間を直し、resetCatalog で架空のデータだけに戻る', () => {
    addShow(show, [episode])
    setEpisodeDuration('fx-1', 90)
    expect(findEpisode('fx-1')?.duration).toBe(90)
    resetCatalog()
    expect(findEpisode('fx-1')).toBeUndefined()
  })
})
