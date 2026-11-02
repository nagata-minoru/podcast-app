import { Pressable, StyleSheet, Text, View } from 'react-native'

import { playPauseLabel } from '@/components/MiniPlayer'
import { ProgressBar } from '@/components/parts'
import { playStateOf, playStatusText } from '@/data/derive'
import { formatDate, formatDuration } from '@/format'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Episode } from '@/types'

/**
 * 番組詳細のエピソード行。行を押すと再生を始め（再生画面は開かない）、右の再生ボタンはその場で再生／一時停止を切り替える。
 * 再生状況は文字と記号で示し、途中の回は進み具合の棒も出す。
 * @param props.episode エピソード
 * @param props.saved 保存済みか
 * @param props.onMenu エピソードのメニューを開く処理
 * @returns エピソード行
 */
export const ShowEpisodeRow = ({ episode, saved, onMenu }: {
  episode: Episode, saved: boolean, onMenu: () => void,
}) => {
  const c = usePalette()
  const player = usePlayer()
  const progress = player.progress[episode.id]
  const current = player.episode?.id === episode.id && player.status !== 'idle'
  const playing = current && player.status === 'playing'
  const { icon, label } = playPauseLabel(playing)
  const meta = `${formatDate(episode.publishedAt)}・${formatDuration(episode.duration)}`
  const nowPlaying = playing ? '▶ 再生中' : '❚❚ 一時停止中'
  const status = [current ? nowPlaying : playStatusText(episode, progress), saved ? '保存済み' : undefined]
    .filter(Boolean).join('・')
  const ratio = playStateOf(progress) === 'inProgress' && progress ? progress.position / episode.duration : undefined
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button" accessibilityLabel={[episode.title, meta, episode.summary, status].join('、')}
        accessibilityHint={current ? undefined : '再生を始めます'}
        onPress={() => player.play(episode)} style={styles.body}>
        <Text style={[styles.title, { color: c.text }]}>{episode.title}</Text>
        <Text style={[styles.sub, { color: c.subText }]}>{meta}</Text>
        <Text numberOfLines={1} style={[styles.sub, { color: c.text }]}>{episode.summary}</Text>
        {ratio !== undefined && <ProgressBar ratio={ratio} />}
        <Text style={[styles.sub, { color: c.text, fontWeight: current ? '700' : '400' }]}>{status}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button" accessibilityLabel={`${episode.title}を${label}`}
        onPress={() => (current ? player.toggle() : player.play(episode))}
        style={[styles.icon, { borderColor: c.border }]}>
        <Text style={{ color: c.text, fontSize: 16 }}>{icon}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button" accessibilityLabel={`${episode.title}のメニュー`} onPress={onMenu}
        style={styles.icon}>
        <Text style={{ color: c.text, fontSize: 20 }}>⋯</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  body: { flex: 1, gap: 3, minHeight: MIN_TAP, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13 },
  icon: {
    width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2, borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
})
