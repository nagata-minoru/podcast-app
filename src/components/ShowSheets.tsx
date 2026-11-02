import { Text } from 'react-native'

import { type Choice, ChoiceGroup } from '@/components/ChoiceGroup'
import { SheetItem } from '@/components/Sheet'
import { useLibrary } from '@/library/LibraryProvider'
import { formatRate, RATES } from '@/player/playerState'
import { useSettings } from '@/settings/SettingsProvider'
import { usePalette } from '@/theme'
import type { Episode, Show } from '@/types'

/** ChoiceGroup で「設定に合わせる」を表す値 */
const FOLLOW_SETTINGS = 0

/**
 * 番組のその他メニューの項目。並びは docs/show-detail.md の順。未設計の項目は理由を添えて押せなくする。
 * シートは番組詳細で1つだけ使い、中身を切り替える（iOS でモーダルを続けて開くと表示されないことがあるため）。
 * @param props.show 番組
 * @param props.followed フォロー中か。フォロー中だけ「通知を設定」「フォローを解除」を出す
 * @param props.hidden 非表示か。非表示なら「番組を非表示」を「番組を再表示」に置き換える
 * @param props.onRate 番組だけの速度を選ぶ画面を開く処理
 * @param props.onHide 非表示の確認を開く処理
 * @param props.onUnhide 再表示する処理
 * @param props.onUnfollow フォローを解除する処理
 * @returns その他メニューの項目
 */
export const ShowMoreItems = ({ show, followed, hidden, onRate, onHide, onUnhide, onUnfollow }: {
  show: Show, followed: boolean, hidden: boolean,
  onRate: () => void, onHide: () => void, onUnhide: () => void, onUnfollow: () => void,
}) => {
  const rate = useLibrary().showRates[show.id]
  const rateNote = rate === undefined ? '設定に合わせる' : formatRate(rate)
  return (
    <>
      <SheetItem label="番組を共有" note="共有予定" />
      <SheetItem label="URLをコピー" note="準備中" />
      <SheetItem label="自動ダウンロードを設定" note="準備中" />
      <SheetItem label={`再生速度をこの番組だけ変更（${rateNote}）`} onPress={onRate} />
      {followed && <SheetItem label="通知を設定" note="準備中" />}
      {hidden ? <SheetItem label="番組を再表示" onPress={onUnhide} /> : <SheetItem label="番組を非表示" onPress={onHide} />}
      {followed && <SheetItem label="フォローを解除" onPress={onUnfollow} />}
      <SheetItem label="問題を報告" note="準備中" />
    </>
  )
}

/**
 * 番組だけの再生速度の選択肢。選んだ速度は、この番組の回を新しく再生するときに使う。
 * @param props.show 番組
 * @param props.onDone 選んだあとの処理（シートを閉じる）
 * @returns 速度の選択肢
 */
export const ShowRateChoices = ({ show, onDone }: { show: Show, onDone: () => void }) => {
  const c = usePalette()
  const { showRates, setShowRate } = useLibrary()
  const settingsRate = useSettings().rate
  const choices: Choice<number>[] = [{
    value: FOLLOW_SETTINGS, label: `設定に合わせる（${formatRate(settingsRate)}）`,
  }, ...RATES.map((r) => ({ value: r, label: formatRate(r) }))]
  return (
    <>
      <Text style={{ color: c.subText, fontSize: 13 }}>新しく再生を始める回に使います。再生中の回の速度は変えません。</Text>
      <ChoiceGroup
        title="この番組の再生速度" choices={choices} value={showRates[show.id] ?? FOLLOW_SETTINGS}
        onChange={(v) => {
          setShowRate(show.id, v === FOLLOW_SETTINGS ? undefined : v)
          onDone()
        }} />
    </>
  )
}

/**
 * エピソードのメニューの項目。保存だけが使え、キュー・ダウンロード・共有は未設計のため押せなくする。
 * @param props.episode 対象のエピソード
 * @param props.onDone 操作したあとの処理（シートを閉じる）
 * @returns エピソードのメニューの項目
 */
export const EpisodeMenuItems = ({ episode, onDone }: { episode: Episode, onDone: () => void }) => {
  const { savedEpisodeIds, toggleSaved } = useLibrary()
  const saved = savedEpisodeIds.includes(episode.id)
  return (
    <>
      <SheetItem label="次に再生" note="準備中" />
      <SheetItem label="キューの最後に追加" note="準備中" />
      <SheetItem
        label={saved ? '✓ 保存済みから外す' : '保存済みに追加'}
        onPress={() => {
          toggleSaved(episode.id)
          onDone()
        }} />
      <SheetItem label="ダウンロード" note="準備中" />
      <SheetItem label="共有" note="共有予定" />
    </>
  )
}
