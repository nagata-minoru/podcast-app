import { act } from '@testing-library/react-native'

// テストごとに保存（Jest ではメモリ上の SQLite）を消し、フィードから取り込んだ番組やライブラリを架空のデータに戻す。
// 画面が残っていても描き直せるよう act で包む
import { clearStorage } from '@/storage/storage'

afterEach(async () => {
  await act(async () => clearStorage())
})
