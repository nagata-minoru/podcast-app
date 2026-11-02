import { type Dispatch, type SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { loadValue, onStorageCleared, saveValue } from '@/storage/storage'

/**
 * 端末に保存する useState。保存がなければ fallback を使い、値が変わるたびに保存する。
 * 保存を消したときは fallback に戻る。
 * @param key 保存のキー
 * @param fallback 保存がないときの値。描画のたびに作り直さない値を渡す（モジュールの定数など）
 * @returns 値と、値を変える関数
 */
export const useStoredState = <T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => loadValue<T>(key) ?? fallback)
  /** 読み込んだ値をそのまま書き戻さないよう、最初の描画では保存しない */
  const loaded = useRef(false)

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true
      return
    }
    saveValue(key, value)
  }, [key, value])

  // 子の画面（/dev-reset）の useEffect で消されても受け取れるよう、それより先に動く useLayoutEffect で受け取り始める
  useLayoutEffect(() => onStorageCleared(() => setValue(fallback)), [fallback])
  return [value, setValue]
}
