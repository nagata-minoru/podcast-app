import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { lacksAudio } from '@/data/audio'
import { findShow } from '@/data/catalog'
import { formatDate, formatLength } from '@/format'
import { useIsHidden } from '@/library/LibraryProvider'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'
import type { Episode, Show, TabName } from '@/types'

/**
 * 画面の土台。背景色を付けたスクロール領域。onRefresh を渡すと、下に引っ張って更新できる。
 * @param props.children 画面の中身
 * @param props.refreshing 更新しているか
 * @param props.onRefresh 下に引っ張ったときに呼ぶ関数
 * @returns スクロールできる画面
 */
export const Screen = ({ children, refreshing = false, onRefresh }: {
  children: ReactNode, refreshing?: boolean, onRefresh?: () => void,
}) => {
  const c = usePalette()
  const refreshControl = onRefresh && (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.subText} />
  )
  return (
    // キーボードを出したままでも、1回のタップでボタンが反応するようにする（検索結果のフォローなど）
    <ScrollView
      keyboardShouldPersistTaps="handled" style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.screen} refreshControl={refreshControl}>
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
 * 何もないときの案内文。
 * @param props.text 案内の文字列
 * @returns 案内文
 */
export const Empty = ({ text }: { text: string }) => {
  const c = usePalette()
  return <Text style={[styles.rowSub, { color: c.subText }]}>{text}</Text>
}

/**
 * 進み具合の細い棒。読み上げは隣の文字（「残り12分」など）に任せる。
 * @param props.ratio 進み具合（0〜1）
 * @param props.height 棒の太さ
 * @returns 進み具合の棒
 */
export const ProgressBar = ({ ratio, height = 4 }: { ratio: number, height?: number }) => {
  const c = usePalette()
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%` as const
  return (
    <View
      accessible={false}
      style={{ height, borderRadius: height / 2, backgroundColor: c.border, overflow: 'hidden' }}>
      <View style={{ width, height, backgroundColor: c.accent }} />
    </View>
  )
}

/** フィードに音声が載っていない回に添える文 */
export const NO_AUDIO = '⊘ 音声なし'

/**
 * エピソードの公開日と長さを「10月29日・36分」の形にする。公開日がわからなければ長さだけにする。
 * @param episode エピソード
 * @returns 公開日と長さの文字列
 */
export const episodeMeta = (episode: Episode) =>
  [episode.publishedAt ? formatDate(episode.publishedAt) : undefined, formatLength(episode.duration)]
    .filter(Boolean).join('・')

/**
 * エピソードの行。タップすると再生を始め、ミニプレイヤーを出す（再生画面は開かない）。
 * 再生中・一時停止中の回は、色だけでなく記号と文字でも示す。非表示にした番組の回（保存済み・履歴）には、その旨を添える。
 * フィードに音声が載っていない回は「音声なし」と示し、押せないようにする。
 * @param props.episode エピソード
 * @param props.status 再生状況の文字列（例: 「未再生」「残り12分」）
 * @param props.withShow 番組名も出すか。いろいろな番組の回が混ざる一覧で使う
 * @returns エピソード行
 */
export const EpisodeRow = ({ episode, status, withShow = false }: {
  episode: Episode, status?: string, withShow?: boolean,
}) => {
  const c = usePalette()
  const player = usePlayer()
  const current = player.episode?.id === episode.id && player.status !== 'idle'
  const noAudio = lacksAudio(episode)
  const meta = episodeMeta(episode)
  const nowPlaying = player.status === 'playing' ? '▶ 再生中' : '❚❚ 一時停止中'
  const showTitle = withShow ? findShow(episode.showId)?.title : undefined
  const hiddenNote = useIsHidden()(episode.showId) ? '⊘ 非表示の番組' : undefined
  const sub = [meta, status, hiddenNote, noAudio ? NO_AUDIO : undefined].filter(Boolean).join('・')
  // 右端の ▶ は飾りなので、読み上げる文は自分で組み立てる
  const label = [showTitle, episode.title, sub, current ? nowPlaying : undefined].filter(Boolean).join('、')
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={current || noAudio ? undefined : '再生を始めます'}
      accessibilityState={{ disabled: noAudio }}
      disabled={noAudio}
      onPress={() => player.play(episode)}
      style={styles.row}>
      <View style={styles.rowBody}>
        {showTitle && <Text style={[styles.rowSub, { color: c.subText }]}>{showTitle}</Text>}
        <Text style={[styles.rowTitle, { color: c.text }]}>{episode.title}</Text>
        <Text style={[styles.rowSub, { color: c.subText }]}>{sub}</Text>
        {current && <Text style={[styles.rowSub, { color: c.text, fontWeight: '700' }]}>{nowPlaying}</Text>}
      </View>
      {!current && !noAudio && <Text style={{ color: c.subText, fontSize: 16 }}>▶</Text>}
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
