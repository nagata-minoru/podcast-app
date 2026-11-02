import { act, fireEvent } from '@testing-library/react-native'
import { renderRouter, screen } from 'expo-router/testing-library'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

describe('再生まわり', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('最初はミニプレイヤーを出さない', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    expect(screen.queryByTestId('mini-player')).toBeNull()
  })

  it('エピソード行を押すと再生が始まり、再生画面は開かずにミニプレイヤーを出す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    expect(screen).toHavePathname('/discover')
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    expect(screen.getByLabelText('一時停止')).toBeOnTheScreen()
    expect(screen.getByText('▶ 再生中')).toBeOnTheScreen()
  })

  it('ミニプレイヤーの右端で一時停止しても、ミニプレイヤーは残る', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('一時停止'))
    expect(screen.getByLabelText('再生')).toBeOnTheScreen()
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    expect(screen.getByText('❚❚ 一時停止中')).toBeOnTheScreen()
  })

  it('タブを切り替えても再生状態を保つ', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    expect(screen).toHavePathname('/library')
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    expect(screen.getByLabelText('一時停止')).toBeOnTheScreen()
  })

  it('ミニプレイヤーのエピソード名で再生画面を開き、操作できる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    // 続きから再生の回は、途中の位置（0:40）から始まる
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのか'))
    expect(screen).toHavePathname('/player')
    expect(screen.getByText('0:40')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('30秒進む'))
    expect(screen.getByText('1:10')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('15秒戻る'))
    expect(screen.getByText('0:55')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('再生速度 1倍'))
    expect(screen.getByText('1.25×')).toBeOnTheScreen()
    expect(screen.getByLabelText('共有予定、使用できません')).toBeDisabled()
  })

  it('再生中は時間とともに位置が進む', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのか'))
    await act(async () => {
      jest.advanceTimersByTime(3000)
    })
    expect(screen.getByText('0:43')).toBeOnTheScreen()
  })

  it('速度を上げると、その分だけ速く進む', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのか'))
    await fireEvent.press(screen.getByLabelText('再生速度 1倍'))
    await act(async () => {
      jest.advanceTimersByTime(4000)
    })
    // 1.25倍で4秒たつと、5秒進む
    expect(screen.getByText('0:45')).toBeOnTheScreen()
  })

  it('最後まで再生すると、再生済みにしてミニプレイヤーを消す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    // 112秒のうち40秒からなので、72秒で最後まで届く
    await act(async () => {
      jest.advanceTimersByTime(73000)
    })
    expect(screen.queryByTestId('mini-player')).toBeNull()
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    await fireEvent.press(screen.getByText('履歴'))
    expect(screen.getAllByText(/再生済み/).length).toBeGreaterThanOrEqual(2)
  })

  it('ミニプレイヤーの番組名で、そのタブの中に番組詳細を開く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('夜ふかし雑談所'))
    expect(screen).toHavePathname('/discover/show/s4')
  })

  it('再生画面の番組名で、再生画面を閉じて番組詳細を開き、再生は続く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('その31 自販機の新商品について'))
    expect(screen).toHavePathname('/player')
    await fireEvent.press(screen.getByText('夜ふかし雑談所 ›'))
    expect(screen).toHavePathname('/discover/show/s4')
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
  })
})
