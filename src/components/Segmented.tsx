import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MIN_TAP, usePalette } from '@/theme'

/**
 * 切り替えボタンの並び。選択中は色に加えて太字と枠線で示す。
 * @param props.items 選択肢の表示名
 * @param props.value 選択中の表示名。省略すると、どれも選択していない状態（例: 検索のテーマ）
 * @param props.onChange 選択が変わったときの処理
 * @returns 切り替えボタン
 */
export const Segmented = <T extends string>(
  { items, value, onChange }: { items: readonly T[], value?: T, onChange: (v: T) => void },
) => {
  const c = usePalette()
  return (
    <View accessibilityRole="tablist" style={styles.wrap}>
      {items.map((item) => {
        const selected = item === value
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(item)}
            style={[styles.item, {
              backgroundColor: selected ? c.surface : c.background,
              borderColor: selected ? c.text : c.border,
            }]}>
            <Text style={{ color: c.text, fontWeight: selected ? '700' : '400' }}>{item}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    minHeight: MIN_TAP, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})
