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

test('percent field dispatches decimal on blur', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const rate = screen.getByLabelText(t.labelRate) as HTMLInputElement
  expect(rate.value).toBe('6')
  fireEvent.change(rate, { target: { value: '5.5' } })
  expect(dispatch).not.toHaveBeenCalled()
  fireEvent.blur(rate)
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { rate: 0.055 } })
})

test('Enter commits the field', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const price = screen.getByLabelText(t.labelPrice)
  fireEvent.change(price, { target: { value: '7500000' } })
  fireEvent.keyDown(price, { key: 'Enter' })
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { price: 7500000 } })
})

test('typing a price digit by digit dispatches once, on blur, with the full value', async () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const price = screen.getByLabelText(t.labelPrice)
  await userEvent.clear(price)
  await userEvent.type(price, '8500000')
  expect(dispatch).not.toHaveBeenCalled()
  await userEvent.tab()
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { price: 8500000 } })
})

test('a cleared field restores the current value on blur without dispatching', async () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const price = screen.getByLabelText(t.labelPrice) as HTMLInputElement
  await userEvent.clear(price)
  expect(price.value).toBe('')
  await userEvent.tab()
  expect(price.value).toBe('9000000')
  expect(dispatch).not.toHaveBeenCalled()
})

test('slider commits immediately', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  fireEvent.change(screen.getByLabelText(`${t.labelPrice} (slider)`), { target: { value: '7500000' } })
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { price: 7500000 } })
})

test('startRent dispatches setStartRent on blur', () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const rent = screen.getByLabelText(t.labelStartRent)
  fireEvent.change(rent, { target: { value: '40000' } })
  fireEvent.blur(rent)
  expect(dispatch).toHaveBeenCalledWith({ type: 'setStartRent', value: 40000 })
})

test('shows a hint when equity exceeds price', () => {
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { price: 1_000_000 } })
  render(<InputPanel state={s} result={computeOwnCost(s.inputs)} dispatch={() => {}} />)
  expect(screen.getByText(t.equityCapped)).toBeInTheDocument()
})

test('no equity hint by default', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  expect(screen.queryByText(t.equityCapped)).toBeNull()
})

test('taxGain checkbox dispatches patch', async () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  await userEvent.click(screen.getByLabelText(t.taxGainLabel))
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { taxGain: true } })
})

test('liquidity box shows payment and cash needed', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  expect(screen.getByText('41 256 NOK')).toBeInTheDocument()
  expect(screen.getByText('2 231 090 NOK')).toBeInTheDocument()
})

test('a value the reducer clamps back to the current one is not left in the field', () => {
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { loanYears: 40 } })
  const dispatch = vi.fn()
  const { rerender } = render(<InputPanel state={s} result={computeOwnCost(s.inputs)} dispatch={dispatch} />)
  const loanYears = screen.getByLabelText(t.labelLoanYears) as HTMLInputElement
  fireEvent.change(loanYears, { target: { value: '99' } })
  fireEvent.blur(loanYears)
  rerender(<InputPanel state={reduce(s, dispatch.mock.calls[0][0])} result={computeOwnCost(s.inputs)} dispatch={dispatch} />)
  expect(loanYears.value).toBe('40')
})

test('holding period and price growth are chosen in the matrix, not the panel', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  expect(screen.queryByLabelText(t.labelYears)).toBeNull()
  expect(screen.queryByLabelText(t.labelPriceGrowth)).toBeNull()
})

test('property tax field explains why it defaults to zero', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  const hint = screen.getByText(t.propertyTaxHint)
  expect(hint.closest('.field')).toBe(screen.getByLabelText(t.labelPropertyTax).closest('.field'))
})
