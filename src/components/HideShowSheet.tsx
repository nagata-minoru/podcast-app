import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { Sheet } from '@/components/Sheet'
import { MIN_TAP, usePalette } from '@/theme'
import type { Show } from '@/types'

/**
 * 非表示の確認の見出し。
 * @param show 対象の番組
 * @returns 見出しの文
 */
export const hideTitle = (show: Show) => `「${show.title}」を非表示にしますか？`

/**
 * 番組を非表示にする前の確認の中身。「保存済みと履歴も削除する」は初期値オフで、開くたびに作り直すためオフに戻る。
 * @param props.followed フォロー中か。フォロー中なら解除することを伝える
 * @param props.onHide 非表示にするときの処理。保存済みと履歴も削除するかを受け取る
 * @returns 確認の中身
 */
export const HideShowContent = ({ followed, onHide }: { followed: boolean, onHide: (deleteData: boolean) => void }) => {
  const c = usePalette()
  const [deleteData, setDeleteData] = useState(false)
  const unfollow = followed ? 'フォローも解除します。' : ''
  return (
    <>
      <Text style={{ color: c.text }}>
        {`ホーム・新着・通常の検索結果に表示しなくなります。${unfollow}設定の「非表示にした番組」から戻せます。`}
      </Text>
      <Pressable
        accessibilityRole="checkbox" accessibilityState={{ checked: deleteData }}
        onPress={() => setDeleteData(!deleteData)} style={styles.check}>
        <Text style={{ color: c.text, fontSize: 20 }}>{deleteData ? '☑' : '☐'}</Text>
        <Text style={{ color: c.text, flex: 1 }}>保存済みと履歴も削除する</Text>
      </Pressable>
      {deleteData && <Text style={{ color: c.subText, fontSize: 13 }}>削除した保存済みと履歴は、再表示しても戻りません。</Text>}
      <Pressable
        accessibilityRole="button" onPress={() => onHide(deleteData)}
        style={[styles.primary, { backgroundColor: c.accent }]}>
        <Text style={{ color: c.onAccent, fontWeight: '700' }}>非表示にする</Text>
      </Pressable>
    </>
  )
}

/**
 * 番組を非表示にする前の確認のシート。ほかのシートを開いていない画面（再生画面）で使う。
 * @param props.show 対象の番組
 * @param props.visible 表示するか
 * @param props.followed フォロー中か
 * @param props.onClose 閉じるときの処理
 * @param props.onHide 非表示にするときの処理
 * @returns 確認のシート
 */
export const HideShowSheet = ({ show, visible, followed, onClose, onHide }: {
  show: Show, visible: boolean, followed: boolean, onClose: () => void, onHide: (deleteData: boolean) => void,
}) => (
  <Sheet visible={visible} title={hideTitle(show)} onClose={onClose}>
    {visible && <HideShowContent followed={followed} onHide={onHide} />}
  </Sheet>
)

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: MIN_TAP },
  primary: { minHeight: MIN_TAP, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
})
