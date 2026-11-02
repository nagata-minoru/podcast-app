import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MIN_TAP, usePalette } from '@/theme'

/** 選択肢。value は内部の値、label は表示名 */
export type Choice<T> = { value: T, label: string }

/**
 * 1つだけ選ぶ設定の選択肢。選択中は色だけでなく「✓」と太字でも示す。
 * @param props.title 読み上げ用のまとまりの名前
 * @param props.choices 選択肢
 * @param props.value 選択中の値
 * @param props.onChange 選択が変わったときの処理
 * @returns 選択肢の並び
 */
export const ChoiceGroup = <T extends string | number>({ title, choices, value, onChange }: {
  title: string, choices: Choice<T>[], value: T, onChange: (v: T) => void,
}) => {
  const c = usePalette()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={title}>
      {choices.map((choice) => {
        const selected = choice.value === value
        return (
          <Pressable
            key={String(choice.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${title} ${choice.label}`}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(choice.value)}
            style={[styles.item, { borderBottomColor: c.border }]}>
            <Text style={{ color: c.text, fontWeight: selected ? '700' : '400' }}>{choice.label}</Text>
            <Text style={{ color: c.accent, fontWeight: '700' }}>{selected ? '✓' : ''}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: MIN_TAP, borderBottomWidth: StyleSheet.hairlineWidth,
  },
})
