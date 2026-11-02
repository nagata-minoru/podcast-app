import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance } from 'react-native'

import { DEFAULT_RATE } from '@/player/playerState'

/** テーマの選び方。system は端末の外観設定に合わせる */
export type ThemeChoice = 'system' | 'light' | 'dark'

/** 設定画面で変えられる値と、その操作 */
export type Settings = {
  /** 新しく再生を始めるときの速度。番組ごとの速度があればそちらを優先する */
  rate: number
  theme: ThemeChoice
  setRate: (rate: number) => void
  setTheme: (theme: ThemeChoice) => void
}

const SettingsContext = createContext<Settings | null>(null)

/**
 * アプリ内の設定を共有する。値はアプリを終了すると元に戻る（保存の仕組みは未設計）。
 * テーマは Appearance.setColorScheme でアプリだけの外観を切り替える。OS の設定は変えない。
 * @param props.children 配下の画面
 * @returns Provider 要素
 */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [theme, setTheme] = useState<ThemeChoice>('system')

  useEffect(() => {
    Appearance.setColorScheme(theme === 'system' ? 'auto' : theme)
  }, [theme])

  const value = useMemo(() => ({ rate, theme, setRate, setTheme }), [rate, theme])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/**
 * 設定の値と操作を取り出す。
 * @returns 設定
 * @throws SettingsProvider の外で呼んだとき
 */
export const useSettings = () => {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings は SettingsProvider の中で使ってください')
  return value
}
