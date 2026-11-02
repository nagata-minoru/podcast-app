import { Pressable, StyleSheet, Text } from 'react-native'

import { useLibrary } from '@/library/LibraryProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Show } from '@/types'

/**
 * 番組のフォローを切り替えるボタン。フォロー中は色だけでなく「✓」と文字、塗りつぶしの有無でも示す。
 * @param props.show 番組
 * @returns フォローボタン
 */
export const FollowButton = ({ show }: { show: Show }) => {
  const c = usePalette()
  const { followedShowIds, toggleFollow } = useLibrary()
  const followed = followedShowIds.includes(show.id)
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityLabel={`${show.title}をフォロー`}
      accessibilityState={{ checked: followed }}
      onPress={() => toggleFollow(show.id)}
      style={[styles.button, {
        backgroundColor: followed ? c.surface : c.background,
        borderColor: followed ? c.text : c.border,
      }]}>
      <Text style={{ color: c.text, fontWeight: followed ? '700' : '400' }}>{followed ? '✓ フォロー中' : '＋ フォロー'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TAP, paddingHorizontal: 12, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})
