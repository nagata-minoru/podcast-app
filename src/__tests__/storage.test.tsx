import { act, cleanup, fireEvent } from '@testing-library/react-native'
import { renderRouter, screen } from 'expo-router/testing-library'

import { addShow, findEpisode, reloadCatalog, setEpisodeDuration } from '@/data/catalog'
import {
  clearStorage, loadFeeds, loadProgress, loadValue, saveFeed, saveProgress, saveValue,
} from '@/storage/storage'
import type { Episode, Progress, Show } from '@/types'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

const show: Show = {
  id: 'fx', title: '保存の試し', publisher: '架空', description: '', category: '', feedUrl: 'https://x.test/f',
}
const episodes: Episode[] = [{
  id: 'fx-2', showId: 'fx', title: '第2回', summary: '', publishedAt: '2026-10-27', duration: 0,
  audioUrl: 'https://x.test/2.mp3',
}, {
  id: 'fx-1', showId: 'fx', title: '第1回', summary: '', publishedAt: '2026-10-26', duration: 60,
}]

/**
 * 再生位置の記録を作る。
 * @param episodeId エピソード ID
 * @param position 再生位置（秒）
 * @returns 記録
 */
const progress = (episodeId: string, position: number): Progress =>
  ({ episodeId, position, completed: false, updatedAt: '2026-11-01T00:00:00.000Z' })

/**
 * アプリを閉じて開き直したことにする。画面を外し、カタログを保存から読み直してから描き直す。
 * @param initialUrl 開き直したときの URL
 */
const restart = async (initialUrl: string) => {
  await cleanup()
  await act(async () => reloadCatalog())
  await renderRouter(APP_DIR, { initialUrl })
}

describe('保存（storage）', () => {
  it('値を JSON で保存して読む。保存がなければ undefined', () => {
    expect(loadValue('rate')).toBeUndefined()
    saveValue('rate', 1.5)
    saveValue('ids', ['a', 'b'])
    expect(loadValue('rate')).toBe(1.5)
    expect(loadValue('ids')).toEqual(['a', 'b'])
  })

  it('再生位置は、最初は全件を、その後は変わった分だけ書く', () => {
    expect(loadProgress()).toBeUndefined()
    const a = progress('a', 10)
    const b = progress('b', 20)
    saveProgress({}, { a, b })
    expect(loadProgress()).toEqual([a, b])
    const b2 = { ...b, position: 30, completed: true }
    saveProgress({ a, b }, { b: b2 })
    expect(loadProgress()).toEqual([b2])
  })

  it('番組は追加した順に、エピソードはフィードの順に読む。追加し直すと入れ替え、順は保つ', () => {
    const other: Show = { ...show, id: 'fy', title: 'もう1つ' }
    saveFeed(show, episodes)
    saveFeed(other, [])
    saveFeed({ ...show, title: '保存の試し（改）' }, episodes.slice(0, 1))
    const feeds = loadFeeds()
    expect(feeds.map((f) => f.show.title)).toEqual(['保存の試し（改）', 'もう1つ'])
    expect(feeds[0].episodes.map((e) => e.id)).toEqual(['fx-2'])
  })

  it('追加した番組と、読み込んだ長さを残す。保存を消すと架空のデータだけに戻る', () => {
    addShow(show, episodes)
    setEpisodeDuration('fx-2', 84)
    expect(loadFeeds()[0].episodes[0].duration).toBe(84)
    clearStorage()
    expect(findEpisode('fx-2')).toBeUndefined()
    expect(loadFeeds()).toEqual([])
  })
})

describe('開き直したとき', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('フォロー・設定・追加した番組・再生位置が残る', async () => {
    addShow(show, episodes)
    await renderRouter(APP_DIR, { initialUrl: '/search' })
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '雑談')
    await fireEvent.press(screen.getByLabelText('夜ふかし雑談所をフォロー'))
    await fireEvent.press(screen.getByLabelText('ホーム'))
    await fireEvent.press(screen.getByLabelText('プロフィールと設定'))
    await fireEvent.press(screen.getByLabelText('テーマ ダーク'))
    await fireEvent.press(screen.getByLabelText('再生速度 1.5×'))

    await restart('/settings')
    expect(screen.getByLabelText('テーマ ダーク')).toBeChecked()
    expect(screen.getByLabelText('再生速度 1.5×')).toBeChecked()

    await restart('/library')
    expect(screen.getByText('夜ふかし雑談所')).toBeOnTheScreen()

    await restart('/search')
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '保存の試し')
    expect(screen.getByText('保存の試し')).toBeOnTheScreen()
  })

  it('聴いた位置が残り、続きから再生と履歴に出る。再生中の回は残さない', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('#42 雨の日の通勤を楽しくする方法'))
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    await restart('/library')
    expect(screen.queryByTestId('mini-player')).toBeNull()
    await fireEvent.press(screen.getByText('履歴'))
    expect(screen.getByText(/0:05まで再生/)).toBeOnTheScreen()
  })

  it('開発中の入口（/dev-reset）でボタンを押すと、保存を消してホームを開く', async () => {
    addShow(show, episodes)
    saveValue('theme', 'dark')
    await renderRouter(APP_DIR, { initialUrl: '/dev-reset' })
    await fireEvent.press(screen.getByText('保存を消してホームを開く'))
    expect(screen).toHavePathname('/home')
    // 初期値に戻した値が書き直されることはある
    expect(loadValue('theme')).not.toBe('dark')
    expect(findEpisode('fx-2')).toBeUndefined()
    // 開いたときに読み込んだ値も、画面の上で初期値に戻っている
    await fireEvent.press(screen.getByLabelText('プロフィールと設定'))
    expect(screen.getByLabelText('テーマ 端末に合わせる')).toBeChecked()
  })
})
