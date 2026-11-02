import { fireEvent, render, screen } from '@testing-library/react-native'

import { Segmented } from '@/components/Segmented'

const ITEMS = ['登録済み', '保存済み', '履歴'] as const

describe('Segmented', () => {
  it('選択肢をタブとして表示し、選択中のものだけ selected にする', async () => {
    await render(<Segmented items={ITEMS} value="保存済み" onChange={() => {}} />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: '保存済み' })).toBeSelected()
    expect(screen.getByRole('tab', { name: '登録済み' })).not.toBeSelected()
  })

  it('押した選択肢を onChange に渡す', async () => {
    const onChange = jest.fn()
    await render(<Segmented items={ITEMS} value="登録済み" onChange={onChange} />)
    await fireEvent.press(screen.getByRole('tab', { name: '履歴' }))
    expect(onChange).toHaveBeenCalledWith('履歴')
  })

  it('value を省略すると、どれも選択していない状態になる', async () => {
    await render(<Segmented items={ITEMS} onChange={() => {}} />)
    screen.getAllByRole('tab').forEach((tab) => expect(tab).not.toBeSelected())
  })
})
