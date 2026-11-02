import { formatDate, formatDuration } from '@/format'

describe('formatDuration', () => {
  it('60分未満は分だけで表す', () => {
    expect(formatDuration(36 * 60)).toBe('36分')
  })

  it('秒は四捨五入して分にする', () => {
    expect(formatDuration(89)).toBe('1分')
    expect(formatDuration(90)).toBe('2分')
  })

  it('60分以上は時間と分で表す', () => {
    expect(formatDuration(60 * 60)).toBe('1時間0分')
    expect(formatDuration(62 * 60)).toBe('1時間2分')
  })
})

describe('formatDate', () => {
  it('ISO 8601 の日付を月日にする', () => {
    expect(formatDate('2026-10-28')).toBe('10月28日')
  })

  it('時刻とタイムゾーンは無視し、先頭の日付を使う', () => {
    expect(formatDate('2026-01-05T23:55:00+09:00')).toBe('1月5日')
  })
})
