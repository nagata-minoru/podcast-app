import { Pressable, StyleSheet, Text } from 'react-native'

import { useLibrary } from '@/library/LibraryProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Show } from '@/types'

/**
 * 番組のフォローを切り替えるボタン。フォロー中は色だけでなく「✓」と文字、塗りつぶしの有無でも示す。
 * @param props.show 番組
 * @param props.full 番組詳細の主ボタンとして「フォローする」と出すか。省略すると短く「フォロー」と出す
 * @param props.onUnfollow フォロー中に押したときの処理。省略するとその場で解除する
 * @returns フォローボタン
 */
export const FollowButton = ({ show, full = false, onUnfollow }: {
  show: Show, full?: boolean, onUnfollow?: () => void,
}) => {
  const c = usePalette()
  const { followedShowIds, toggleFollow } = useLibrary()
  const followed = followedShowIds.includes(show.id)
  const text = followed ? '✓ フォロー中' : `＋ ${full ? 'フォローする' : 'フォロー'}`
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityLabel={`${show.title}をフォロー`}
      accessibilityState={{ checked: followed }}
      onPress={() => (followed && onUnfollow ? onUnfollow() : toggleFollow(show.id))}
      style={[styles.button, {
        backgroundColor: followed ? c.surface : c.background,
        borderColor: followed ? c.text : c.border,
      }]}>
      <Text style={{ color: c.text, fontWeight: followed ? '700' : '400' }}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TAP, paddingHorizontal: 12, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})
