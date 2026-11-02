import { Link, Stack } from 'expo-router'
import { Pressable, Text } from 'react-native'

import { ContinueCard, Shelf, ShowCard } from '@/components/cards'
import { Empty, Screen, SectionTitle } from '@/components/parts'
import { useCatalog } from '@/data/catalog'
import { inProgress, topShowsByHistory } from '@/data/derive'
import { useIsHidden } from '@/library/LibraryProvider'
import { usePlayer } from '@/player/PlayerProvider'
import { MIN_TAP, usePalette } from '@/theme'

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
 * ホーム。続きから再生を最優先にし、その下に利用履歴にもとづくトップ番組を横に並べる。
 * どちらも再生位置の記録から作るため、聴くたびに並びが変わる。非表示にした番組は、どちらにも出さない。
 * @returns ホーム画面
 */
const Home = () => {
  const { history } = usePlayer()
  const isHidden = useIsHidden()
  // フィードから取り込んだ番組の回も出すため、カタログの変更で描き直す
  useCatalog()
  const continues = inProgress(history).filter(({ episode }) => !isHidden(episode.showId))
  // 非表示にした番組の回を聴いても、トップ番組には再登場させない
  const top = topShowsByHistory(history).filter((s) => !isHidden(s.id))
  return (
    <Screen>
      <Stack.Screen options={{ title: 'ホーム', headerRight: () => <ProfileButton /> }} />
      <SectionTitle title="続きから再生" />
      {continues.length === 0 && <Empty text="途中まで聴いたエピソードはありません。" />}
      {continues.map(({ episode, progress }) => (
        <ContinueCard key={episode.id} episode={episode} progress={progress} />
      ))}
      <SectionTitle title="あなたのトップ番組" />
      {top.length === 0 && <Empty text="エピソードを聴くと、よく聴く番組がここに並びます。" />}
      <Shelf>{top.map((s) => <ShowCard key={s.id} show={s} tab="home" note={s.category} />)}</Shelf>
    </Screen>
  )
}

export default Home
