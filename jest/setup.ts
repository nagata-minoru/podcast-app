import { act } from '@testing-library/react-native'

// テストごとに、フィードから取り込んだ番組を消して架空のデータだけに戻す。画面が残っていても描き直せるよう act で包む
import { resetCatalog } from '@/data/catalog'

afterEach(async () => {
  await act(async () => resetCatalog())
})
