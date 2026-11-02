import { useUndoToast } from '@/components/UndoToast'
import { episodesOfShow } from '@/data/catalog'
import { useLibrary } from '@/library/LibraryProvider'
import { usePlayer } from '@/player/PlayerProvider'
import type { Show } from '@/types'

/**
 * 番組を非表示にしたときの通知の文を作る。仕様は docs/show-detail.md の「非表示にする操作」。
 * @param wasFollowed 非表示にする前にフォローしていたか
 * @param deleteData 保存済みと履歴も削除するか
 * @returns 通知の文
 */
export const hideMessage = (wasFollowed: boolean, deleteData: boolean) => {
  const unfollow = wasFollowed ? 'フォローを解除し、' : ''
  const data = deleteData ? '保存済みと履歴は削除しました。' : '保存済みと履歴は保持します。'
  return `番組を非表示にしました。${unfollow}ホーム・新着・通常の検索結果には表示しません。${data}`
}

/**
 * 番組全体に対する操作（フォロー解除、非表示、再表示）と、「元に戻す」付きの通知をまとめる。
 * 番組詳細と再生画面で同じ動きにするために使う。
 * @param show 対象の番組
 * @returns フォロー・非表示の状態、各操作、画面に置く通知の要素 toast
 */
export const useShowActions = (show: Show | undefined) => {
  const library = useLibrary()
  const player = usePlayer()
  const { show: showToast, element: toast } = useUndoToast()
  const id = show?.id ?? ''
  const followed = library.followedShowIds.includes(id)
  const hidden = library.hiddenShowIds.includes(id)

  /** フォローを解除し、「元に戻す」で戻せるようにする */
  const unfollow = () => {
    library.unfollow(id)
    showToast({ message: 'フォローを解除しました', undo: () => library.follow(id) })
  }

  /**
   * 番組を非表示にする。保存済みと履歴の削除は、元に戻さずに通知が消えてから行う。
   * @param deleteData 保存済みと履歴も削除するか
   */
  const hide = (deleteData: boolean) => {
    const episodeIds = episodesOfShow(id).map((e) => e.id)
    library.hide(id)
    showToast({
      message: hideMessage(followed, deleteData),
      undo: () => {
        library.unhide(id)
        if (followed) library.follow(id)
      },
      onExpire: deleteData ? () => {
        library.removeSaved(episodeIds)
        player.forget(episodeIds)
      } : undefined,
    })
  }

  /** 非表示を解除する。フォローは戻さない */
  const unhide = () => {
    library.unhide(id)
    showToast({ message: '番組を再表示しました' })
  }

  return { followed, hidden, unfollow, hide, unhide, toast }
}
