import { Tabs } from 'expo-router/tabs'
import { Text } from 'react-native'

import { TabBar } from '@/components/TabBar'
import { usePalette } from '@/theme'
import type { TabName } from '@/types'

/** タブごとの表示名とアイコン。アイコンは選択中に塗りつぶしへ切り替え、色以外でも状態を示す */
const TABS: { name: TabName, title: string, icon: string, iconFocused: string }[] = [{
  name: 'home', title: 'ホーム', icon: '⌂', iconFocused: '⌂',
}, {
  name: 'discover', title: '新着・おすすめ', icon: '✧', iconFocused: '✦',
}, {
  name: 'library', title: 'ライブラリ', icon: '▢', iconFocused: '▣',
}, {
  name: 'search', title: '検索', icon: '⌕', iconFocused: '⌕',
}]

/**
 * 下部4タブ。選択中のタブは色に加えて、アイコンの形とラベルの太字・下線で示す。
 * @returns タブナビゲーター
 */
const TabsLayout = () => {
  const c = usePalette()
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.subText,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Text style={{ color, fontSize: 22 }}>{focused ? tab.iconFocused : tab.icon}</Text>
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={{
                  color, fontSize: 11, fontWeight: focused ? '700' : '400',
                  textDecorationLine: focused ? 'underline' : 'none',
                }}>
                {tab.title}
              </Text>
            ),
          }} />
      ))}
    </Tabs>
  )
}

export default TabsLayout
