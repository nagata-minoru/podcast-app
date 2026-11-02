import { act, fireEvent } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderRouter, screen } from 'expo-router/testing-library'

import { TOAST_MS } from '@/components/UndoToast'
import { hideMessage } from '@/library/useShowActions'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

/**
 * 通知が消えるまで時間を進める。
 */
const waitToastGone = async () => {
  await act(async () => {
    jest.advanceTimersByTime(TOAST_MS)
  })
}

/**
 * 番組詳細のその他メニューから「番組を非表示」を選び、確認を出す。
 */
const openHideConfirm = async () => {
  await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
  await fireEvent.press(screen.getByLabelText('番組を非表示'))
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('番組詳細', () => {
  it('フォロー中を押すと確認なしで解除し、「元に戻す」で戻せる。通知は数秒で消える', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await fireEvent.press(screen.getByLabelText('台所サイエンスをフォロー'))
    expect(screen.getByText('＋ フォローする')).toBeOnTheScreen()
    expect(screen.getByText('フォローを解除しました')).toBeOnTheScreen()
    await fireEvent.press(screen.getByText('元に戻す'))
    expect(screen.getByText('✓ フォロー中')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('台所サイエンスをフォロー'))
    await waitToastGone()
    expect(screen.queryByTestId('undo-toast')).toBeNull()
  })

  it('紹介文は「もっと見る」で開き、「閉じる」で戻す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await fireEvent.press(screen.getByText('もっと見る'))
    expect(screen.getByText('閉じる')).toBeOnTheScreen()
  })

  it('再生途中の回を一覧の上の欄にも出し、絞り込みと番組内検索でしぼれる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    // 絞り込みにも「再生途中」があるため、見出しで探す
    expect(screen.getByRole('header', { name: '再生途中' })).toBeOnTheScreen()
    expect(screen.getByText('エピソード（2本）')).toBeOnTheScreen()
    await fireEvent.press(screen.getByText('未再生'))
    expect(screen.getByText('エピソード（1本）')).toBeOnTheScreen()
    expect(screen.getByText('第17回 だしのうま味の正体')).toBeOnTheScreen()
    await fireEvent.press(screen.getByText('すべて'))
    await fireEvent.changeText(screen.getByLabelText('この番組のエピソードを検索'), 'うま味')
    expect(screen.getByText('エピソード（1本）')).toBeOnTheScreen()
    await fireEvent.changeText(screen.getByLabelText('この番組のエピソードを検索'), 'ない言葉')
    expect(screen.getByText('条件に合うエピソードはありません。')).toBeOnTheScreen()
  })

  it('行内の再生ボタンはその場で再生と一時停止を切り替える', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await fireEvent.press(screen.getByLabelText('第17回 だしのうま味の正体を再生'))
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    // ミニプレイヤーにも同じ名前のボタンがあるため、先にある行内のボタンを押す
    await fireEvent.press(screen.getAllByLabelText('第17回 だしのうま味の正体を一時停止')[0])
    expect(screen.queryAllByLabelText('第17回 だしのうま味の正体を一時停止')).toHaveLength(0)
  })

  it('エピソードのメニューから保存済みに追加できる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await fireEvent.press(screen.getByLabelText('第17回 だしのうま味の正体のメニュー'))
    expect(screen.getByLabelText('ダウンロード、準備中')).toBeDisabled()
    await fireEvent.press(screen.getByText('保存済みに追加'))
    expect(screen.getByText('○ 未再生・保存済み')).toBeOnTheScreen()
  })

  it('番組だけの再生速度を選ぶと、この番組の回を新しく再生するときに使う', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
    await fireEvent.press(screen.getByLabelText('再生速度をこの番組だけ変更（設定に合わせる）'))
    await fireEvent.press(screen.getByLabelText('この番組の再生速度 1.25×'))
    expect(screen.getByText('この番組の再生速度: 1.25×')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('第17回 だしのうま味の正体を再生'))
    await fireEvent.press(screen.getByLabelText('第17回 だしのうま味の正体'))
    expect(screen.getByText('1.25×')).toBeOnTheScreen()
  })
})

describe('番組の非表示', () => {
  it('非表示にするとフォローを解除し、ホーム・新着・ライブラリの登録済みから外す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await openHideConfirm()
    expect(screen.getByText('「台所サイエンス」を非表示にしますか？')).toBeOnTheScreen()
    await fireEvent.press(screen.getByText('非表示にする'))
    expect(screen.getByText(hideMessage(true, false))).toBeOnTheScreen()
    expect(screen.getByText(/非表示にしている番組です/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('ホーム'))
    expect(screen.queryByLabelText('第18回 卵はなぜ固まるのかを再生')).toBeNull()
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    expect(screen.queryByText('台所サイエンス')).toBeNull()
    await fireEvent.press(screen.getByText('履歴'))
    expect(screen.getByText(/⊘ 非表示の番組/)).toBeOnTheScreen()
  })

  it('「元に戻す」で非表示とフォロー解除をまとめて取り消す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover/show/s2' })
    await openHideConfirm()
    await fireEvent.press(screen.getByText('非表示にする'))
    await fireEvent.press(screen.getByText('元に戻す'))
    expect(screen.queryByText(/非表示にしている番組です/)).toBeNull()
    expect(screen.getByText('✓ フォロー中')).toBeOnTheScreen()
  })

  it('「保存済みと履歴も削除する」をオンにすると、通知が消えてから削除する', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/search/show/s3' })
    await openHideConfirm()
    await fireEvent.press(screen.getByRole('checkbox'))
    await fireEvent.press(screen.getByText('非表示にする'))
    expect(screen.getByText(hideMessage(false, true))).toBeOnTheScreen()
    await waitToastGone()
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    await fireEvent.press(screen.getByText('保存済み'))
    expect(screen.getByText('保存したエピソードはありません。')).toBeOnTheScreen()
  })

  it('検索では、番組名と完全一致したときだけ「非表示の番組」として末尾に出す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/search' })
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '夜ふかし')
    await fireEvent.press(screen.getByText('夜ふかし雑談所'))
    await openHideConfirm()
    await fireEvent.press(screen.getByText('非表示にする'))
    await act(async () => router.back())
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '雑談')
    expect(screen.getAllByText('見つかりませんでした。')).toHaveLength(2)
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), ' 夜ふかし雑談所 ')
    expect(screen.getByText('⊘ 非表示の番組・ねむれない二人')).toBeOnTheScreen()
  })

  it('設定の「非表示にした番組」から再表示できる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home/show/s4' })
    await openHideConfirm()
    await fireEvent.press(screen.getByText('非表示にする'))
    await fireEvent.press(screen.getByLabelText('番組のその他の操作'))
    expect(screen.getByLabelText('番組を再表示')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('閉じる'))
    await act(async () => router.push('/settings/hidden-shows'))
    await fireEvent.press(screen.getByLabelText('夜ふかし雑談所を再表示'))
    expect(screen.getByText('非表示にした番組はありません。')).toBeOnTheScreen()
  })
})
