import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Artwork } from '@/components/parts'
import { findShow } from '@/data/catalog'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { TabName } from '@/types'

/**
 * 再生／一時停止のアイコンと読み上げ名。状態を色ではなく形と言葉で示す。
 * @param playing 再生中かどうか
 * @returns 表示する記号と、押したときの操作名
 */
export const playPauseLabel = (playing: boolean) => (
  playing ? { icon: '❚❚', label: '一時停止' } : { icon: '▶', label: '再生' }
)

/**
 * タブバーの直上に出すミニプレイヤー。何も再生していないときは出さない。
 * タップ領域は3つに分ける。アートワークとエピソード名は再生画面、番組名は番組詳細、右端はその場で再生／一時停止。
 * エピソード名と番組名をそれぞれ最低 44pt の高さにするため、2段にしている。
 * @param props.tab 表示中のタブ。番組詳細をこのタブの中に開き、再生画面から戻る先にも使う
 * @returns ミニプレイヤー。再生していなければ null
 */
export const MiniPlayer = ({ tab }: { tab: TabName }) => {
  const c = usePalette()
  const { episode, status, position, duration, toggle } = usePlayer()
  if (!episode || status === 'idle') return null
  const show = findShow(episode.showId)
  const { icon, label } = playPauseLabel(status === 'playing')
  const ratio = duration > 0 ? position / duration : 0
  return (
    <View
      testID="mini-player"
      style={[styles.wrap, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <View accessible={false} style={[styles.track, { backgroundColor: c.border }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: c.accent }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={episode.title}
            accessibilityHint="再生画面を開きます"
            onPress={() => router.push({ pathname: '/player', params: { tab } })}
            style={styles.area}>
            <Artwork title={show?.title ?? episode.title} size={36} />
            <Text numberOfLines={1} style={[styles.title, { color: c.text }]}>{episode.title}</Text>
          </Pressable>
          {show && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={show.title}
              accessibilityHint="番組詳細を開きます"
              onPress={() => router.push(`/${tab}/show/${show.id}`)}
              style={styles.area}>
              <Text numberOfLines={1} style={[styles.show, { color: c.subText }]}>{`${show.title} ›`}</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={toggle}
          style={styles.toggle}>
          <Text style={{ color: c.text, fontSize: 22 }}>{icon}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth },
  track: { height: 3 },
  fill: { height: 3 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, gap: 8 },
  body: { flex: 1 },
  area: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: MIN_TAP },
  title: { flex: 1, fontSize: 15, fontWeight: '600' },
  show: { flex: 1, fontSize: 13, paddingLeft: 46 },
  toggle: { width: 56, minHeight: MIN_TAP * 2, alignItems: 'center', justifyContent: 'center' },
})
