import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { playPauseLabel } from '@/components/MiniPlayer'
import { Artwork, ProgressBar } from '@/components/parts'
import { findShow } from '@/data/catalog'
import { formatDuration } from '@/format'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Episode, Feature, Progress, Show, TabName } from '@/types'

/** 横並びの番組カードの幅 */
const SHOW_CARD_WIDTH = 120

/**
 * 横にスクロールする棚。画面の左右の余白をはみ出して端まで流す。
 * @param props.children 並べるカード
 * @returns 横スクロールの領域
 */
export const Shelf = ({ children }: { children: ReactNode }) => (
  <ScrollView
    horizontal showsHorizontalScrollIndicator={false} style={styles.shelf} contentContainerStyle={styles.shelfBody}>
    {children}
  </ScrollView>
)

/**
 * 横並び用の番組カード。タップするとそのタブの中で番組詳細を開く。
 * アートワークがなくても区別できるよう、番組名と補足を必ず出す。
 * @param props.show 番組
 * @param props.tab 番組詳細を積むタブ
 * @param props.note 番組名の下に出す補足（例: 「1位・科学」）
 * @returns 番組カード
 */
export const ShowCard = ({ show, tab, note }: { show: Show, tab: TabName, note?: string }) => {
  const c = usePalette()
  return (
    <Link href={`/${tab}/show/${show.id}`} asChild>
      <Pressable
        accessibilityRole="link" accessibilityLabel={note ? `${show.title}、${note}` : show.title}
        accessibilityHint="番組詳細を開きます" style={styles.showCard}>
        <Artwork title={show.title} size={SHOW_CARD_WIDTH} />
        <Text numberOfLines={2} style={[styles.cardTitle, { color: c.text }]}>{show.title}</Text>
        {note && <Text numberOfLines={1} style={[styles.cardSub, { color: c.subText }]}>{note}</Text>}
      </Pressable>
    </Link>
  )
}

/**
 * 続きから再生のカード。進み具合の棒と残り時間を出し、右の再生ボタンですぐに再生する。
 * 再生中の回では、ボタンが一時停止に変わる。
 * @param props.episode エピソード
 * @param props.progress そのエピソードの再生位置の記録
 * @returns 続きから再生のカード
 */
export const ContinueCard = ({ episode, progress }: { episode: Episode, progress: Progress }) => {
  const c = usePalette()
  const player = usePlayer()
  const show = findShow(episode.showId)
  const current = player.episode?.id === episode.id && player.status !== 'idle'
  const { icon, label } = playPauseLabel(current && player.status === 'playing')
  const rest = `残り${formatDuration(episode.duration - progress.position)}`
  return (
    <View style={[styles.continueCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Artwork title={show?.title ?? episode.title} size={56} />
      <View accessible accessibilityLabel={[show?.title, episode.title, rest].join('、')} style={styles.continueBody}>
        {show && <Text numberOfLines={1} style={[styles.cardSub, { color: c.subText }]}>{show.title}</Text>}
        <Text numberOfLines={2} style={[styles.cardTitle, { color: c.text }]}>{episode.title}</Text>
        <ProgressBar ratio={progress.position / episode.duration} />
        <Text style={[styles.cardSub, { color: c.subText }]}>{rest}</Text>
      </View>
      <Pressable
        accessibilityRole="button" accessibilityLabel={`${episode.title}を${label}`}
        onPress={() => (current ? player.toggle() : player.play(episode))}
        style={[styles.playButton, { backgroundColor: c.accent }]}>
        <Text style={{ color: c.onAccent, fontSize: 20 }}>{icon}</Text>
      </Pressable>
    </View>
  )
}

/**
 * 注目の特集のカード。タップすると取り上げた番組の詳細を、そのタブの中で開く。
 * @param props.feature 特集
 * @param props.tab 番組詳細を積むタブ
 * @returns 特集のカード
 */
export const FeatureCard = ({ feature, tab }: { feature: Feature, tab: TabName }) => {
  const c = usePalette()
  const show = findShow(feature.showId)
  if (!show) return null
  return (
    <Link href={`/${tab}/show/${show.id}`} asChild>
      <Pressable
        accessibilityRole="link" accessibilityLabel={`特集、${feature.title}、${show.title}、${feature.description}`}
        accessibilityHint="番組詳細を開きます"
        // Link の asChild に配列のスタイルは渡せないため、1つにまとめる
        style={StyleSheet.flatten([styles.featureCard, { backgroundColor: c.surface, borderColor: c.border }])}>
        <Artwork title={show.title} size={88} />
        <View style={styles.continueBody}>
          <Text style={[styles.cardSub, { color: c.subText }]}>{`特集・${show.title}`}</Text>
          <Text style={[styles.featureTitle, { color: c.text }]}>{feature.title}</Text>
          <Text numberOfLines={3} style={[styles.cardSub, { color: c.text }]}>{feature.description}</Text>
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  shelf: { marginHorizontal: -16 },
  shelfBody: { paddingHorizontal: 16, gap: 12 },
  showCard: { width: SHOW_CARD_WIDTH, gap: 4, minHeight: MIN_TAP },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 13 },
  continueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  continueBody: { flex: 1, gap: 4 },
  playButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  featureTitle: { fontSize: 18, fontWeight: '700' },
})
