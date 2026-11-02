import { Link } from 'expo-router'
import { Fragment } from 'react'
import { Pressable, Text } from 'react-native'

import { Screen, SectionTitle } from '@/components/parts'
import { MIN_TAP, usePalette } from '@/theme'

/** 区分ごとの項目。未設計の機能は「準備中」として表示だけにする */
const SECTIONS: { title: string, items: string[] }[] = [{
  title: 'アカウント', items: ['プロフィール', '通知先（準備中）', 'サブスクリプション（準備中）'],
}, {
  title: '再生', items: ['再生速度', '自動ダウンロード（準備中）', '次の話を再生'],
}, {
  title: 'アプリ', items: ['テーマ', '通知（準備中）', 'ストレージ'],
}]

/**
 * 設定。アカウント／再生／アプリ／コンテンツ管理の4区分。OS側で決める設定は扱わない。
 * @returns 設定画面
 */
const Settings = () => {
  const c = usePalette()
  return (
    <Screen>
      {SECTIONS.map((s) => (
        <Fragment key={s.title}>
          <SectionTitle title={s.title} />
          {s.items.map((item) => (
            <Text key={item} style={{ color: c.text, minHeight: MIN_TAP, textAlignVertical: 'center' }}>{item}</Text>
          ))}
        </Fragment>
      ))}
      <SectionTitle title="コンテンツ管理" />
      <Link href="/settings/hidden-shows" asChild>
        <Pressable accessibilityRole="link" style={{ minHeight: MIN_TAP, justifyContent: 'center' }}>
          <Text style={{ color: c.text }}>非表示にした番組 ›</Text>
        </Pressable>
      </Link>
    </Screen>
  )
}

export default Settings
