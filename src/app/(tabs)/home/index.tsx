import { Link, Stack } from 'expo-router'
import { Pressable, Text } from 'react-native'

import { EpisodeRow, Screen, SectionTitle, ShowRow } from '@/components/parts'
import { episodes, findEpisode, progresses, shows } from '@/data/mock'
import { formatDuration } from '@/format'
import { MIN_TAP, usePalette } from '@/theme'

/**
 * 利用履歴（再生記録の件数）の多い順に番組を並べる。
 * @returns 「あなたのトップ番組」に出す番組
 */
const topShowsByHistory = () => {
  const counts = new Map<string, number>()
  progresses.forEach((p) => {
    const showId = findEpisode(p.episodeId)?.showId
    if (showId) counts.set(showId, (counts.get(showId) ?? 0) + 1)
  })
  return shows.filter((s) => counts.has(s.id)).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
}

/**
 * 右上のプロフィールアイコン。設定を開く。
 * @returns 設定へのリンク
 */
const ProfileButton = () => {
  const c = usePalette()
  return (
    <Link href="/settings" asChild>
      <Pressable
        accessibilityRole="button" accessibilityLabel="プロフィールと設定"
        style={{ minWidth: MIN_TAP, minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.text, fontSize: 22 }}>○</Text>
      </Pressable>
    </Link>
  )
}

/**
 * ホーム。続きから再生を最優先にし、その下に利用履歴にもとづくトップ番組を出す。
 * @returns ホーム画面
 */
const Home = () => {
  const inProgress = progresses
    .filter((p) => !p.completed)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <Screen>
      <Stack.Screen options={{ title: 'ホーム', headerRight: () => <ProfileButton /> }} />
      <SectionTitle title="続きから再生" />
      {inProgress.map((p) => {
        const episode = episodes.find((e) => e.id === p.episodeId)
        if (!episode) return null
        const status = `残り${formatDuration(episode.duration - p.position)}`
        return <EpisodeRow key={p.episodeId} episode={episode} status={status} />
      })}
      <SectionTitle title="あなたのトップ番組" />
      {topShowsByHistory().map((s) => <ShowRow key={s.id} show={s} tab="home" />)}
    </Screen>
  )
}

export default Home
