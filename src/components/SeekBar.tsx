import { useState } from 'react'
import { type AccessibilityActionEvent, Pressable, StyleSheet, View } from 'react-native'

import { formatSpokenClock } from '@/format'
import { SKIP_BACK, SKIP_FORWARD } from '@/player/playerState'
import { MIN_TAP, usePalette } from '@/theme'

/**
 * 再生位置のスライダー。押した場所へ移動する。
 * スクリーンリーダーでは調整可能な要素として読み上げ、上下のスワイプで 30秒進む・15秒戻る。
 * @param props.position 再生位置（秒）
 * @param props.duration 再生時間（秒）
 * @param props.onSeekTo 指定位置へ移動する処理
 * @param props.onSeek 相対的に移動する処理
 * @returns スライダー
 */
export const SeekBar = ({ position, duration, onSeekTo, onSeek }: {
  position: number, duration: number, onSeekTo: (position: number) => void, onSeek: (delta: number) => void,
}) => {
  const c = usePalette()
  const [width, setWidth] = useState(0)
  const ratio = duration > 0 ? Math.min(position / duration, 1) : 0

  /**
   * スクリーンリーダーの調整操作を受け取る。
   * @param e 操作のイベント
   */
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') onSeek(SKIP_FORWARD)
    if (e.nativeEvent.actionName === 'decrement') onSeek(-SKIP_BACK)
  }

  return (
    <Pressable
      testID="seek-bar"
      accessibilityRole="adjustable"
      accessibilityLabel="再生位置"
      accessibilityValue={{ text: `${formatSpokenClock(position)}、全体${formatSpokenClock(duration)}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAction}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onPress={(e) => {
        if (width > 0) onSeekTo((e.nativeEvent.locationX / width) * duration)
      }}
      style={styles.hit}>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: c.accent }]} />
      </View>
      <View style={[styles.thumb, { left: `${ratio * 100}%`, backgroundColor: c.text }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: { minHeight: MIN_TAP, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
  thumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7 },
})
