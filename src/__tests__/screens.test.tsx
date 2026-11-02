import { act, fireEvent } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderRouter, screen } from 'expo-router/testing-library'

/** 実際の画面フォルダ。Jest はプロジェクトの直下で動くため、そこからの相対パスで渡す */
const APP_DIR = './src/app'

describe('主要画面', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('ホームの続きから再生は、残り時間を出し、再生ボタンですぐ再生と一時停止ができる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    // e3 は 112秒のうち 40秒まで聴いた回
    expect(screen.getByText('残り1分')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを一時停止'))
    expect(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生')).toBeOnTheScreen()
  })

  it('聴いた位置を記録し、ライブラリの履歴に再生位置を出す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('#42 雨の日の通勤を楽しくする方法'))
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    await fireEvent.press(screen.getByText('履歴'))
    expect(screen.getByText(/0:05まで再生/)).toBeOnTheScreen()
    expect(screen.getByText(/再生済み/)).toBeOnTheScreen()
  })

  it('新着・おすすめに注目の特集を出し、押すと番組詳細を開く', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('台所から始める秋の科学'))
    expect(screen).toHavePathname('/discover/show/s2')
  })

  it('ライブラリの登録済みに未再生の本数を出す', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/library' })
    // 朝の余白ラジオは e1 が未再生、e2 が再生済み
    expect(screen.getByText(/未再生 1本・最新: #42/)).toBeOnTheScreen()
  })

  it('検索結果の番組をフォローすると、ライブラリの登録済みに加わる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/search' })
    await fireEvent.changeText(screen.getByLabelText('番組・エピソード・テーマを検索'), '雑談')
    expect(screen.getByText('＋ フォロー')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('夜ふかし雑談所をフォロー'))
    expect(screen.getByText('✓ フォロー中')).toBeOnTheScreen()
    await fireEvent.press(screen.getByLabelText('ライブラリ'))
    expect(screen.getByText('夜ふかし雑談所')).toBeOnTheScreen()
  })

  it('再生画面のメニューから保存済みに追加できる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/discover' })
    await fireEvent.press(screen.getByText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('その31 自販機の新商品について'))
    await fireEvent.press(screen.getByLabelText('その他の操作'))
    await fireEvent.press(screen.getByText('保存済みに追加'))
    expect(screen.getByText('✓ 保存済みから外す')).toBeOnTheScreen()
  })
})

describe('設定', () => {
  it('再生速度を選ぶと、新しく再生を始める回にその速度を使う', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/home' })
    await fireEvent.press(screen.getByLabelText('プロフィールと設定'))
    await fireEvent.press(screen.getByLabelText('再生速度 1.5×'))
    expect(screen.getByLabelText('再生速度 1.5×')).toBeChecked()
    expect(screen.getByLabelText('再生速度 1.0×')).not.toBeChecked()
    await act(async () => router.back())
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのかを再生'))
    await fireEvent.press(screen.getByLabelText('第18回 卵はなぜ固まるのか'))
    expect(screen.getByText('1.5×')).toBeOnTheScreen()
  })

  it('テーマを選べる。最初は端末に合わせる', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/settings' })
    expect(screen.getByLabelText('テーマ 端末に合わせる')).toBeChecked()
    await fireEvent.press(screen.getByLabelText('テーマ ダーク'))
    expect(screen.getByLabelText('テーマ ダーク')).toBeChecked()
  })

  it('未設計の項目は準備中として押せない', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/settings' })
    expect(screen.getByLabelText('自動ダウンロード、準備中')).toBeDisabled()
  })
})
