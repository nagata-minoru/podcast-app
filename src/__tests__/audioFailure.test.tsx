import { fireEvent } from '@testing-library/react-native'
import { renderRouter, screen } from 'expo-router/testing-library'

// 音声が1つもない状態にして、読み込めないときの動きを確かめる
jest.mock('@/data/audio', () => ({
  ...jest.requireActual('@/data/audio'), episodeAudio: {}, audioSourceOf: () => undefined,
}))

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

describe('音声を読み込めないとき', () => {
  it('一時停止にして、再生画面に理由を出す。ミニプレイヤーは残す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    expect(screen.getByLabelText('再生')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのか'))
    expect(screen.getByRole('alert')).toHaveTextContent(/音声を読み込めませんでした/)
    // 再生し直しても音声がなければ、また一時停止に戻る
    await fireEvent.press(screen.getByLabelText('再生'))
    expect(screen.getByLabelText('再生')).toBeOnTheScreen()
    expect(screen.getByRole('alert')).toBeOnTheScreen()
  })
})
