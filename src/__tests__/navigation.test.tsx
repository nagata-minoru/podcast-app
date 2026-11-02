import { fireEvent } from '@testing-library/react-native'
import { renderRouter, screen } from 'expo-router/testing-library'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

describe('画面遷移', () => {
  it('起動するとホームタブを開く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/' })
    expect(screen).toHavePathname('/home')
    expect(screen.getByText('続きから再生')).toBeOnTheScreen()
  })

  it('下部タブで画面を切り替えられる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    expect(screen).toHavePathname('/library')
    await fireEvent.press(screen.getByLabelText('検索'))
    expect(screen).toHavePathname('/search')
    await fireEvent.press(screen.getByLabelText('新着・おすすめ'))
    expect(screen).toHavePathname('/discover')
  })

  it('番組カードを押すと、そのタブの中で番組詳細を開く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByLabelText('台所サイエンス、1位・科学'))
    expect(screen).toHavePathname('/discover/show/s2')
    expect(screen.getByText('第17回 だしのうま味の正体')).toBeOnTheScreen()
  })

  it('ホーム右上のプロフィールアイコンから設定を開く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('プロフィールと設定'))
    expect(screen).toHavePathname('/settings')
    expect(screen.getByText('コンテンツ管理')).toBeOnTheScreen()
  })
})
