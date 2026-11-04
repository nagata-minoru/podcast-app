import { formatClock, formatDate, formatDateTime, formatDuration, formatSpokenClock } from '@/format'

describe('formatDuration', () => {
  it('60分未満は分だけで表す', () => {
    expect(formatDuration(36 * 60)).toBe('36分')
  })

  it('秒は四捨五入して分にする', () => {
    expect(formatDuration(89)).toBe('1分')
    expect(formatDuration(90)).toBe('2分')
  })

  it('1分に満たないときは秒で表す', () => {
    expect(formatDuration(59.2)).toBe('60秒')
    expect(formatDuration(20)).toBe('20秒')
    expect(formatDuration(0)).toBe('0秒')
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

describe('formatDateTime', () => {
  it('端末の時間帯の月日と時分にし、分は2桁にする', () => {
    expect(formatDateTime(new Date(2026, 10, 4, 18, 6).toISOString())).toBe('11月4日 18:06')
    expect(formatDateTime(new Date(2026, 0, 9, 0, 30).toISOString())).toBe('1月9日 0:30')
  })
})

describe('formatClock', () => {
  it('1時間未満は分:秒で表す', () => {
    expect(formatClock(723)).toBe('12:03')
    expect(formatClock(5.9)).toBe('0:05')
  })

  it('1時間以上は時:分:秒で表し、負の値は0にする', () => {
    expect(formatClock(3725)).toBe('1:02:05')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('formatSpokenClock', () => {
  it('読み上げ用に時間・分・秒で表す', () => {
    expect(formatSpokenClock(723)).toBe('12分3秒')
    expect(formatSpokenClock(3725)).toBe('1時間2分5秒')
  })
})
