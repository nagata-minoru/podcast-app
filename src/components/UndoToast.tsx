import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native'

import { MIN_TAP, usePalette } from '@/theme'

/** 通知の中身 */
export type ToastContent = {
  message: string
  /** 「元に戻す」で行う処理。省略すると「元に戻す」を出さない */
  undo?: () => void
  /** 元に戻さずに通知が消えたとき（画面を離れたときを含む）に行う処理 */
  onExpire?: () => void
}

/** 通知を出しておく時間（ミリ秒） */
export const TOAST_MS = 5000
/** スクリーンリーダーの使用中は、操作する時間を取れるよう長めにする */
export const TOAST_MS_SCREEN_READER = 10000

/**
 * スクリーンリーダーを使っているかを返す。
 * @returns 使用中なら true
 */
const useScreenReader = () => {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setEnabled).catch(() => setEnabled(false))
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled)
    return () => sub.remove()
  }, [])
  return enabled
}

/**
 * 「元に戻す」付きの通知を出すフック。数秒で消え、消えたときに onExpire を行う。
 * 新しい通知を出したときと画面を離れたときも、前の通知は元に戻さずに消えたものとして扱う。
 * @returns 通知を出す関数 show と、画面に置く要素 element
 */
export const useUndoToast = () => {
  const [toast, setToast] = useState<ToastContent | null>(null)
  const pending = useRef<ToastContent | null>(null)
  const screenReader = useScreenReader()

  const expire = useCallback(() => {
    const current = pending.current
    pending.current = null
    setToast(null)
    current?.onExpire?.()
  }, [])

  const show = useCallback((content: ToastContent) => {
    expire()
    pending.current = content
    setToast(content)
    AccessibilityInfo.announceForAccessibility(content.undo ? `${content.message}。元に戻せます` : content.message)
  }, [expire])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(expire, screenReader ? TOAST_MS_SCREEN_READER : TOAST_MS)
    return () => clearTimeout(id)
  }, [toast, screenReader, expire])

  // 画面を離れたら、元に戻さなかったものとして後の処理を行う
  useEffect(() => expire, [expire])

  const undo = () => {
    const current = pending.current
    pending.current = null
    setToast(null)
    current?.undo?.()
  }

  const element = toast ? <ToastView message={toast.message} onUndo={toast.undo ? undo : undefined} /> : null
  return { show, element }
}

/**
 * 画面の下に重ねて出す通知。
 * @param props.message 通知の文
 * @param props.onUndo 「元に戻す」を押したときの処理。なければボタンを出さない
 * @returns 通知の要素
 */
const ToastView = ({ message, onUndo }: { message: string, onUndo?: () => void }) => {
  const c = usePalette()
  return (
    <View
      testID="undo-toast" accessibilityLiveRegion="polite"
      style={[styles.wrap, { backgroundColor: c.text }]}>
      <Text style={[styles.message, { color: c.background }]}>{message}</Text>
      {onUndo && (
        <Pressable accessibilityRole="button" onPress={onUndo} style={styles.undo}>
          <Text style={{ color: c.background, fontWeight: '700', textDecorationLine: 'underline' }}>元に戻す</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 16, right: 16, bottom: 12, borderRadius: 10, paddingLeft: 14, paddingRight: 6,
    paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  message: { flex: 1, fontSize: 14, paddingVertical: 8 },
  undo: { minHeight: MIN_TAP, minWidth: MIN_TAP, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
})
