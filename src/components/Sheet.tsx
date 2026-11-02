import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { MIN_TAP, usePalette } from '@/theme'

/**
 * 下から出すシート。背景か「閉じる」で閉じる。番組のその他メニュー、エピソードのメニュー、確認に使う。
 * @param props.visible 表示するか
 * @param props.title シートの見出し
 * @param props.onClose 閉じるときの処理
 * @param props.children シートの中身
 * @returns シート
 */
export const Sheet = ({ visible, title, onClose, children }: {
  visible: boolean, title: string, onClose: () => void, children: ReactNode,
}) => {
  const c = usePalette()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessible={false} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: '#0008' }]} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{title}</Text>
          {children}
          <SheetItem label="閉じる" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

/**
 * シートの項目。使えない項目は押せなくし、理由を色だけでなく文字でも添える。
 * @param props.label 項目名
 * @param props.onPress 押したときの処理
 * @param props.note 使えない理由（例: 「準備中」）。あると押せない
 * @returns シートの項目
 */
export const SheetItem = ({ label, onPress, note }: { label: string, onPress?: () => void, note?: string }) => {
  const c = usePalette()
  const disabled = !!note
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={note ? `${label}、${note}` : label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={[styles.item, { borderTopColor: c.border }]}>
      <Text style={{ color: disabled ? c.subText : c.text, fontSize: 16 }}>{label}</Text>
      {note && <Text style={{ color: c.subText, fontSize: 13 }}>{note}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, padding: 16, paddingBottom: 36, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: MIN_TAP, borderTopWidth: StyleSheet.hairlineWidth,
  },
})
