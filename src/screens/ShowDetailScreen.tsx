import { Stack, useLocalSearchParams } from 'expo-router'
import { type ReactNode, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FollowButton } from '@/components/FollowButton'
import { HideShowContent, hideTitle } from '@/components/HideShowSheet'
import { Artwork, Empty, Screen, SectionTitle } from '@/components/parts'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { ShowEpisodeRow } from '@/components/ShowEpisodeRow'
import { EpisodeMenuItems, ShowMoreItems, ShowRateChoices } from '@/components/ShowSheets'
import { playStateOf } from '@/data/derive'
import { episodesOfShow, findShow } from '@/data/mock'
import { useLibrary } from '@/library/LibraryProvider'
import { useShowActions } from '@/library/useShowActions'
import { usePlayer } from '@/player/PlayerProvider'
import { formatRate } from '@/player/playerState'
import { MIN_TAP, usePalette } from '@/theme'
import type { Episode, Progress, Show } from '@/types'

const FILTERS = ['すべて', '未再生', '再生途中', '保存済み'] as const
type Filter = (typeof FILTERS)[number]

/** 開いているシート。番組詳細ではシートを1つだけ使い、中身を切り替える */
type SheetState = { kind: 'more' } | { kind: 'rate' } | { kind: 'hide' } | { kind: 'episode', episode: Episode } | null

/**
 * 絞り込みと番組内検索に合うエピソードを返す。
 * @param list 番組のエピソード（新しい順）
 * @param filter 絞り込み
 * @param query 番組内検索の語
 * @param progress エピソードごとの再生位置の記録
 * @param saved 保存済みのエピソード ID
 * @returns 条件に合うエピソード
 */
export const filterEpisodes = (
  list: Episode[], filter: Filter, query: string, progress: Record<string, Progress>, saved: string[],
) => {
  const q = query.trim().toLowerCase()
  return list.filter((e) => {
    const state = playStateOf(progress[e.id])
    const byFilter = (
      filter === 'すべて' ||
      (filter === '未再生' && state === 'unplayed') ||
      (filter === '再生途中' && state === 'inProgress') ||
      (filter === '保存済み' && saved.includes(e.id))
    )
    return byFilter && `${e.title} ${e.summary}`.toLowerCase().includes(q)
  })
}

/**
 * 番組の概要。紹介文は3行で省略し、「もっと見る」で全文を出す。
 * @param props.show 番組
 * @returns 番組の概要
 */
const Overview = ({ show }: { show: Show }) => {
  const c = usePalette()
  const [expanded, setExpanded] = useState(false)
  const rate = useLibrary().showRates[show.id]
  return (
    <View style={styles.overview}>
      <Text numberOfLines={expanded ? undefined : 3} style={{ color: c.text }}>{show.description}</Text>
      <Pressable
        accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
        style={styles.more}>
        <Text style={{ color: c.text, textDecorationLine: 'underline' }}>{expanded ? '閉じる' : 'もっと見る'}</Text>
      </Pressable>
      <Text style={{ color: c.subText }}>{`${show.category}・${show.updateFrequency}`}</Text>
      {rate !== undefined && <Text style={{ color: c.subText }}>{`この番組の再生速度: ${formatRate(rate)}`}</Text>}
    </View>
  )
}

/**
 * 番組詳細の上部。アートワーク、番組名、配信者名、フォローの主ボタン。非表示の番組なら、その旨も出す。
 * @param props.show 番組
 * @param props.hidden 非表示か
 * @param props.onUnfollow フォロー中の主ボタンを押したときの処理
 * @returns 上部
 */
const Header = ({ show, hidden, onUnfollow }: { show: Show, hidden: boolean, onUnfollow: () => void }) => {
  const c = usePalette()
  return (
    <>
      <View style={styles.header}>
        <Artwork title={show.title} size={88} />
        <View style={styles.headerBody}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{show.title}</Text>
          <Text style={{ color: c.subText }}>{show.publisher}</Text>
          <View style={styles.follow}><FollowButton show={show} full onUnfollow={onUnfollow} /></View>
        </View>
      </View>
      {hidden && (
        <Text style={[styles.hidden, { color: c.text, borderColor: c.border }]}>
          ⊘ 非表示にしている番組です。右上の「⋯」から再表示できます。
        </Text>
      )}
    </>
  )
}

/**
 * エピソードの欄。再生途中の欄の下に、絞り込みと番組内検索を通した新しい順の一覧を置く。
 * @param props.show 番組
 * @param props.onMenu エピソードのメニューを開く処理
 * @returns エピソードの欄
 */
const Episodes = ({ show, onMenu }: { show: Show, onMenu: (episode: Episode) => void }) => {
  const c = usePalette()
  const { progress } = usePlayer()
  const { savedEpisodeIds } = useLibrary()
  const [filter, setFilter] = useState<Filter>('すべて')
  const [query, setQuery] = useState('')
  const all = episodesOfShow(show.id)
  const resuming = all.filter((e) => playStateOf(progress[e.id]) === 'inProgress')
  const list = filterEpisodes(all, filter, query, progress, savedEpisodeIds)
  const row = (e: Episode) => (
    <ShowEpisodeRow key={e.id} episode={e} saved={savedEpisodeIds.includes(e.id)} onMenu={() => onMenu(e)} />
  )
  return (
    <>
      <Segmented items={FILTERS} value={filter} onChange={setFilter} />
      <TextInput
        value={query} onChangeText={setQuery} placeholder="この番組のエピソードを検索"
        placeholderTextColor={c.subText} accessibilityLabel="この番組のエピソードを検索" returnKeyType="search"
        style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]} />
      {filter === 'すべて' && query.trim() === '' && resuming.length > 0 && (
        <>
          <SectionTitle title="再生途中" />
          {resuming.map(row)}
        </>
      )}
      <SectionTitle title={`エピソード（${list.length}本）`} />
      {list.length === 0 && <Empty text="条件に合うエピソードはありません。" />}
      {list.map(row)}
    </>
  )
}

/**
 * 番組詳細（補助画面）。各タブの show/[id] から共通で使い、開いたタブの画面履歴に積む。仕様は docs/show-detail.md。
 * @returns 番組詳細画面
 */
const ShowDetailScreen = () => {
  const c = usePalette()
  const { id } = useLocalSearchParams<{ id: string }>()
  const show = findShow(id)
  const actions = useShowActions(show)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  if (!show) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '番組詳細' }} />
        <Text style={{ color: c.text }}>番組が見つかりません。</Text>
      </Screen>
    )
  }
  /**
   * シートの見出しと中身を、開いているシートの種類から決める。
   * @param s 開いているシート
   * @returns 見出しと中身
   */
  const sheetBody = (s: NonNullable<SheetState>): { title: string, body: ReactNode } => {
    if (s.kind === 'rate') return { title: 'この番組の再生速度', body: <ShowRateChoices show={show} onDone={close} /> }
    if (s.kind === 'episode') {
      return { title: s.episode.title, body: <EpisodeMenuItems episode={s.episode} onDone={close} /> }
    }
    if (s.kind === 'hide') {
      const onHide = (deleteData: boolean) => {
        close()
        actions.hide(deleteData)
      }
      return { title: hideTitle(show), body: <HideShowContent followed={actions.followed} onHide={onHide} /> }
    }
    const items = (
      <ShowMoreItems
        show={show} followed={actions.followed} hidden={actions.hidden}
        onRate={() => setSheet({ kind: 'rate' })} onHide={() => setSheet({ kind: 'hide' })}
        onUnhide={() => {
          close()
          actions.unhide()
        }}
        onUnfollow={() => {
          close()
          actions.unfollow()
        }} />
    )
    return { title: show.title, body: items }
  }
  const opened = sheet ? sheetBody(sheet) : null
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable
              accessibilityRole="button" accessibilityLabel="番組のその他の操作"
              onPress={() => setSheet({ kind: 'more' })} style={styles.headerButton}>
              <Text style={{ color: c.text, fontSize: 22 }}>⋯</Text>
            </Pressable>
          ),
        }} />
      <Screen>
        <Header show={show} hidden={actions.hidden} onUnfollow={actions.unfollow} />
        <Overview show={show} />
        <Episodes show={show} onMenu={(episode) => setSheet({ kind: 'episode', episode })} />
        <SectionTitle title="この番組について" />
        <Text style={{ color: c.subText }}>{`配信者: ${show.publisher}`}</Text>
        <Text style={{ color: c.subText }}>{`更新: ${show.updateFrequency}`}</Text>
        {/* 通知を重ねても最後の行が隠れないよう、下に余白を取る */}
        <View style={{ height: 72 }} />
      </Screen>
      <Sheet visible={!!opened} title={opened?.title ?? ''} onClose={close}>{opened?.body}</Sheet>
      {actions.toast}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerBody: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  follow: { alignSelf: 'flex-start', marginTop: 4 },
  hidden: { borderWidth: 1, borderRadius: 8, padding: 10 },
  overview: { gap: 4 },
  more: { minHeight: MIN_TAP, justifyContent: 'center', alignSelf: 'flex-start' },
  input: { minHeight: MIN_TAP, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
  headerButton: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
})

export default ShowDetailScreen
