import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputPanel } from './InputPanel'
import { DEFAULT_STATE } from '../state/types'
import { reduce } from '../state/reducer'
import { computeOwnCost } from '../model/ownCost'
import { DEFAULT_INPUTS } from '../model/defaults'
import { t } from '../i18n/nb'

const d = DEFAULT_INPUTS

test('borettslag hides dokumentavgift and shows felleskostnader', async () => {
  const dispatch = vi.fn()
  const { rerender } = render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  expect(screen.getByLabelText(t.labelDocFeeRate)).toBeInTheDocument()
  expect(screen.queryByLabelText(t.labelCommonCosts)).toBeNull()
  await userEvent.click(screen.getByRole('radio', { name: t.ownershipBorettslag }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { ownershipType: 'borettslag' } })
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { ownershipType: 'borettslag' } })
  rerender(<InputPanel state={s} result={computeOwnCost(s.inputs)} dispatch={dispatch} />)
  expect(screen.queryByLabelText(t.labelDocFeeRate)).toBeNull()
  expect(screen.getByLabelText(t.labelCommonCosts)).toBeInTheDocument()
})

test('percent field dispatches decimal', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const rate = screen.getByLabelText(t.labelRate) as HTMLInputElement
  expect(rate.value).toBe('6')
  fireEvent.change(rate, { target: { value: '5.5' } })
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { rate: 0.055 } })
})

test('amount field dispatches number and startRent dispatches setStartRent', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  fireEvent.change(screen.getByLabelText(t.labelPrice), { target: { value: '7500000' } })
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { price: 7500000 } })
  fireEvent.change(screen.getByLabelText(t.labelStartRent), { target: { value: '40000' } })
  expect(dispatch).toHaveBeenCalledWith({ type: 'setStartRent', value: 40000 })
})

test('taxGain checkbox dispatches patch', async () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  await userEvent.click(screen.getByLabelText(t.taxGainLabel))
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { taxGain: true } })
})

test('liquidity box shows payment and cash needed', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  expect(screen.getByText('41 256 kr')).toBeInTheDocument()
  expect(screen.getByText('2 231 090 kr')).toBeInTheDocument()
})
