import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs'
import { View } from 'react-native'

/**
 * 下部タブバー。手順2でミニプレイヤーをタブバーの直上（この View の先頭）に置く。
 * タブバーと同じ部品に入れることで、どのタブでも同じ位置に表示される。
 * @param props expo-router の Tabs から渡されるタブバーの props
 * @returns ミニプレイヤーの枠とタブバー
 */
export const TabBar = (props: BottomTabBarProps) => (
  <View>
    <BottomTabBar {...props} />
  </View>
)
