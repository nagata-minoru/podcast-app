import { Text } from 'react-native'

import { Screen } from '@/components/parts'
import { showPreferences } from '@/data/mock'
import { usePalette } from '@/theme'

/**
 * 非表示にした番組の一覧。再表示の操作は、非表示の仕組みを作る段階で加える。
 * @returns 非表示にした番組の画面
 */
const HiddenShows = () => {
  const c = usePalette()
  const hidden = showPreferences.filter((p) => p.hidden)
  return (
    <Screen>
      {hidden.length === 0 && <Text style={{ color: c.subText }}>非表示にした番組はありません。</Text>}
    </Screen>
  )
}

export default HiddenShows
