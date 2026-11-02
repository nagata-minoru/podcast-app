import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs'
import { View } from 'react-native'

import { MiniPlayer } from '@/components/MiniPlayer'
import type { TabName } from '@/types'

/**
 * 下部タブバー。再生中はミニプレイヤーをタブバーの直上に置く。
 * タブバーと同じ部品に入れることで、どのタブでも同じ位置に表示される。
 * @param props expo-router の Tabs から渡されるタブバーの props
 * @returns ミニプレイヤーとタブバー
 */
export const TabBar = (props: BottomTabBarProps) => {
  const tab = props.state.routes[props.state.index].name as TabName
  return (
    <View>
      <MiniPlayer tab={tab} />
      <BottomTabBar {...props} />
    </View>
  )
}
