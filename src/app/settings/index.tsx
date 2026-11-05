import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { type Choice, ChoiceGroup } from '@/components/ChoiceGroup'
import { Screen, SectionTitle } from '@/components/parts'
import { AUDIO_CREDITS } from '@/data/audio'
import { formatRate, RATES } from '@/player/playerState'
import { type ThemeChoice, useSettings } from '@/settings/SettingsProvider'
import { MIN_TAP, usePalette } from '@/theme'

/** 再生速度の選択肢 */
const RATE_CHOICES: Choice<number>[] = RATES.map((r) => ({ value: r, label: formatRate(r) }))

/** テーマの選択肢 */
const THEME_CHOICES: Choice<ThemeChoice>[] = [{
  value: 'system', label: '端末に合わせる',
}, {
  value: 'light', label: 'ライト',
}, {
  value: 'dark', label: 'ダーク',
}]

/**
 * まだ使えない項目。押せないことを色だけでなく「準備中」の文字でも示す。
 * @param props.label 項目名
 * @returns 無効の項目
 */
const PendingItem = ({ label }: { label: string }) => {
  const c = usePalette()
  return (
    <View
      accessible accessibilityLabel={`${label}、準備中`} accessibilityState={{ disabled: true }}
      style={[styles.item, { borderBottomColor: c.border }]}>
      <Text style={{ color: c.subText }}>{label}</Text>
      <Text style={{ color: c.subText, fontSize: 13 }}>準備中</Text>
    </View>
  )
}

/**
 * 小見出し。区分の中で、選択肢のまとまりに名前を付ける。
 * @param props.title 小見出しの文字列
 * @returns 小見出し
 */
const Label = ({ title }: { title: string }) => {
  const c = usePalette()
  return <Text style={[styles.label, { color: c.subText }]}>{title}</Text>
}

/**
 * 設定。アカウント／再生／アプリ／コンテンツ管理の4区分と、同梱の音声のクレジット。OS側で決める設定は扱わない。
 * いま使えるのは再生速度とテーマだけで、値はアプリを終了すると元に戻る。
 * @returns 設定画面
 */
const Settings = () => {
  const c = usePalette()
  const settings = useSettings()
  return (
    <Screen>
      <SectionTitle title="アカウント" />
      <View>
        {['プロフィール', '通知先', 'サブスクリプション'].map((l) => <PendingItem key={l} label={l} />)}
      </View>
      <SectionTitle title="再生" />
      <Label title="再生速度（新しく再生を始める回に使います）" />
      <ChoiceGroup title="再生速度" choices={RATE_CHOICES} value={settings.rate} onChange={settings.setRate} />
      <View>
        {['自動ダウンロード', '次の話を再生'].map((l) => <PendingItem key={l} label={l} />)}
      </View>
      <SectionTitle title="アプリ" />
      <Label title="テーマ" />
      <ChoiceGroup title="テーマ" choices={THEME_CHOICES} value={settings.theme} onChange={settings.setTheme} />
      <View>
        {['通知', 'ストレージ'].map((l) => <PendingItem key={l} label={l} />)}
      </View>
      <SectionTitle title="コンテンツ管理" />
      <Link href="/settings/hidden-shows" asChild>
        <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.item, { borderBottomColor: c.border }])}>
          <Text style={{ color: c.text }}>非表示にした番組</Text>
          <Text style={{ color: c.subText }}>›</Text>
        </Pressable>
      </Link>
      <SectionTitle title="音声のクレジット" />
      <Text style={{ color: c.subText }}>架空の番組の音声は、VOICEVOX で作りました。</Text>
      {AUDIO_CREDITS.map((credit) => <Text key={credit} style={{ color: c.text }}>{credit}</Text>)}
    </Screen>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: MIN_TAP, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 13 },
})

export default Settings
