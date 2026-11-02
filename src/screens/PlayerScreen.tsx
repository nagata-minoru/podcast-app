import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playPauseLabel } from '@/components/MiniPlayer'
import { Artwork } from '@/components/parts'
import { SeekBar } from '@/components/SeekBar'
import { findShow } from '@/data/mock'
import { formatClock } from '@/format'
import { useLibrary } from '@/library/LibraryProvider'
import { usePlayer } from '@/player/PlayerProvider'
import { formatRate, nextRate, SKIP_BACK, SKIP_FORWARD } from '@/player/playerState'
import { MIN_TAP, type Palette, usePalette } from '@/theme'
import type { TabName } from '@/types'

const TAB_NAMES: TabName[] = ['home', 'discover', 'library', 'search']

/** 下部の補助操作。どれもまだ使えないため、理由を短い文字で添えて無効にする */
const SUB_ACTIONS = [{
  icon: '☰', label: 'キュー', note: '準備中',
}, {
  icon: '◎', label: '出力先', note: '準備中',
}, {
  icon: '↗', label: '共有予定', note: '使用できません',
}]

/**
 * 補助操作のボタン。押せない状態は色だけでなく「準備中」などの文字でも示す。
 * @param props.c 色の組
 * @param props.icon 記号
 * @param props.label ラベル
 * @param props.note 無効の理由
 * @returns 無効の補助操作ボタン
 */
const DisabledAction = ({ c, icon, label, note }: { c: Palette, icon: string, label: string, note: string }) => (
  <Pressable
    disabled
    accessibilityRole="button"
    accessibilityLabel={`${label}、${note}`}
    accessibilityState={{ disabled: true }}
    style={styles.subAction}>
    <Text style={{ color: c.subText, fontSize: 18 }}>{icon}</Text>
    <Text style={{ color: c.subText, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: c.subText, fontSize: 10 }}>{note}</Text>
  </Pressable>
)

/**
 * 「⋯」のメニュー。再生速度と保存済みへの追加が使え、ほかは準備中として表示だけにする。
 * 「問題を報告」は送信先が未設計のため置かない。
 * @param props.c 色の組
 * @param props.rate 現在の再生速度
 * @param props.onRate 再生速度を切り替える処理
 * @param props.saved 再生中の回が保存済みか
 * @param props.onSave 保存済みへの追加・削除を切り替える処理
 * @returns メニュー
 */
const MoreMenu = ({ c, rate, onRate, saved, onSave }: {
  c: Palette, rate: number, onRate: () => void, saved: boolean, onSave: () => void,
}) => {
  const items = ['キューを表示（準備中）', '共有予定（使用できません）', '番組を非表示（準備中）']
  return (
    <View accessibilityRole="menu" style={[styles.menu, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable accessibilityRole="menuitem" onPress={onRate} style={styles.menuItem}>
        <Text style={{ color: c.text }}>{`再生速度（${formatRate(rate)}）`}</Text>
      </Pressable>
      <Pressable accessibilityRole="menuitem" onPress={onSave} style={styles.menuItem}>
        <Text style={{ color: c.text }}>{saved ? '✓ 保存済みから外す' : '保存済みに追加'}</Text>
      </Pressable>
      {items.map((item) => (
        <Pressable
          key={item} disabled accessibilityRole="menuitem" accessibilityState={{ disabled: true }}
          style={styles.menuItem}>
          <Text style={{ color: c.subText }}>{item}</Text>
        </Pressable>
      ))}
    </View>
  )
}

/**
 * 再生画面（下から開くモーダル）。中央の再生／一時停止を最大にし、15秒戻る・30秒進む・速度を常に出す。
 * 番組名を押すと、再生画面を閉じてから、開く前のタブの中で番組詳細を開く。再生は止めない。
 * @returns 再生画面
 */
export const PlayerScreen = () => {
  const c = usePalette()
  const player = usePlayer()
  const library = useLibrary()
  const [menuOpen, setMenuOpen] = useState(false)
  const params = useLocalSearchParams<{ tab?: string }>()
  const tab = TAB_NAMES.find((t) => t === params.tab) ?? 'home'
  const { episode, status, position, duration, rate } = player
  const show = episode ? findShow(episode.showId) : undefined
  const { icon, label } = playPauseLabel(status === 'playing')

  /** 再生画面を閉じてから番組詳細を開く */
  const openShow = () => {
    if (!show) return
    router.back()
    router.push(`/${tab}/show/${show.id}`)
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="再生画面を閉じる" onPress={() => router.back()}
          style={styles.iconButton}>
          <Text style={{ color: c.text, fontSize: 24 }}>⌄</Text>
        </Pressable>
        {episode && (
          <Pressable
            accessibilityRole="button" accessibilityLabel="その他の操作" accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen(!menuOpen)} style={styles.iconButton}>
            <Text style={{ color: c.text, fontSize: 24 }}>⋯</Text>
          </Pressable>
        )}
      </View>
      {menuOpen && episode && (
        <MoreMenu
          c={c} rate={rate} onRate={() => player.setRate(nextRate(rate))}
          saved={library.savedEpisodeIds.includes(episode.id)} onSave={() => library.toggleSaved(episode.id)} />
      )}
      {!episode || status === 'idle' ? (
        <Text style={[styles.empty, { color: c.subText }]}>再生中のエピソードはありません。</Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.center}><Artwork title={show?.title ?? episode.title} size={200} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{episode.title}</Text>
          {show && (
            <Pressable
              accessibilityRole="link" accessibilityHint="再生画面を閉じて番組詳細を開きます" onPress={openShow}
              style={styles.showLink}>
              <Text style={{ color: c.subText, fontSize: 15 }}>{`${show.title} ›`}</Text>
            </Pressable>
          )}
          <SeekBar position={position} duration={duration} onSeekTo={player.seekTo} onSeek={player.seek} />
          <View style={styles.times}>
            <Text style={{ color: c.subText }}>{formatClock(position)}</Text>
            <Text style={{ color: c.subText }}>{`-${formatClock(duration - position)}`}</Text>
          </View>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button" accessibilityLabel={`${SKIP_BACK}秒戻る`}
              onPress={() => player.seek(-SKIP_BACK)} style={styles.skip}>
              <Text style={{ color: c.text, fontSize: 18 }}>{`↺${SKIP_BACK}`}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button" accessibilityLabel={label} onPress={player.toggle}
              style={[styles.main, { backgroundColor: c.accent }]}>
              <Text style={{ color: c.onAccent, fontSize: 32 }}>{icon}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button" accessibilityLabel={`${SKIP_FORWARD}秒進む`}
              onPress={() => player.seek(SKIP_FORWARD)} style={styles.skip}>
              <Text style={{ color: c.text, fontSize: 18 }}>{`${SKIP_FORWARD}↻`}</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button" accessibilityLabel={`再生速度 ${rate}倍`} accessibilityHint="押すと速度を切り替えます"
            onPress={() => player.setRate(nextRate(rate))}
            style={[styles.rate, { borderColor: c.border }]}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{formatRate(rate)}</Text>
          </Pressable>
          <View style={styles.subActions}>
            {SUB_ACTIONS.map((a) => <DisabledAction key={a.label} c={c} {...a} />)}
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  menu: {
    position: 'absolute', top: 52, right: 20, zIndex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
  },
  menuItem: { minHeight: MIN_TAP, justifyContent: 'center' },
  empty: { marginTop: 40, textAlign: 'center' },
  body: { flex: 1, gap: 8 },
  center: { alignItems: 'center', marginVertical: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  showLink: { minHeight: MIN_TAP, justifyContent: 'center', alignSelf: 'flex-start' },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 8 },
  skip: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  main: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  rate: {
    alignSelf: 'center', minWidth: MIN_TAP * 2, minHeight: MIN_TAP, borderWidth: 1, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  subActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 'auto', marginBottom: 8 },
  subAction: { minWidth: MIN_TAP * 2, minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center', gap: 2 },
})
