import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { formatDate, formatDuration } from '@/format'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Episode, Show, TabName } from '@/types'

/**
 * 画面の土台。背景色を付けたスクロール領域。
 * @param props.children 画面の中身
 * @returns スクロールできる画面
 */
export const Screen = ({ children }: { children: ReactNode }) => {
  const c = usePalette()
  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.screen}>
      {children}
    </ScrollView>
  )
}

/**
 * 区切りの見出し。
 * @param props.title 見出しの文字列
 * @returns 見出し要素
 */
export const SectionTitle = ({ title }: { title: string }) => {
  const c = usePalette()
  return <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
}

/**
 * アートワークの代わりに表示するプレースホルダ。番組名の頭文字を出す。
 * @param props.title 番組名
 * @param props.size 一辺の長さ
 * @returns プレースホルダ要素
 */
export const Artwork = ({ title, size = 56 }: { title: string, size?: number }) => {
  const c = usePalette()
  return (
    <View
      accessible={false}
      style={[styles.artwork, { width: size, height: size, backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={{ color: c.subText, fontSize: size / 2.5, fontWeight: '700' }}>{title.slice(0, 1)}</Text>
    </View>
  )
}

/**
 * 番組の行。タップするとそのタブの中で番組詳細を開く。
 * @param props.show 番組
 * @param props.tab 番組詳細を積むタブ
 * @param props.note 番組名の下に出す補足
 * @returns 番組行
 */
export const ShowRow = ({ show, tab, note }: { show: Show, tab: TabName, note?: string }) => {
  const c = usePalette()
  return (
    <Link href={`/${tab}/show/${show.id}`} asChild>
      <Pressable accessibilityRole="link" accessibilityHint="番組詳細を開きます" style={styles.row}>
        <Artwork title={show.title} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: c.text }]}>{show.title}</Text>
          <Text style={[styles.rowSub, { color: c.subText }]}>{note ?? show.publisher}</Text>
        </View>
      </Pressable>
    </Link>
  )
}

/**
 * エピソードの行。タップすると再生を始め、ミニプレイヤーを出す（再生画面は開かない）。
 * 再生中・一時停止中の回は、色だけでなく記号と文字でも示す。
 * @param props.episode エピソード
 * @param props.status 再生状況の文字列（例: 「未再生」「残り12分」）
 * @returns エピソード行
 */
export const EpisodeRow = ({ episode, status }: { episode: Episode, status?: string }) => {
  const c = usePalette()
  const player = usePlayer()
  const current = player.episode?.id === episode.id && player.status !== 'idle'
  const meta = `${formatDate(episode.publishedAt)}・${formatDuration(episode.duration)}`
  const nowPlaying = player.status === 'playing' ? '▶ 再生中' : '❚❚ 一時停止中'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={current ? undefined : '再生を始めます'}
      onPress={() => player.play(episode)}
      style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: c.text }]}>{episode.title}</Text>
        <Text style={[styles.rowSub, { color: c.subText }]}>{status ? `${meta}・${status}` : meta}</Text>
        {current && <Text style={[styles.rowSub, { color: c.text, fontWeight: '700' }]}>{nowPlaying}</Text>}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  artwork: { borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TAP, paddingVertical: 6 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13 },
})
