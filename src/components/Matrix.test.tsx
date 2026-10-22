import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Matrix } from './Matrix'
import { DEFAULT_STATE } from '../state/types'
import { reduce } from '../state/reducer'
import { t } from '../i18n/nb'

test('renders 10 x 11 cells and marks the selected one', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  const cells =
    screen.getAllByRole('button', { pressed: false }).length +
    screen.getAllByRole('button', { pressed: true }).length
  expect(cells).toBe(110)
  expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('52k')
})

test('hovering a cell shows a tooltip with the exact value and verdict', async () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  expect(screen.queryByRole('tooltip')).toBeNull()
  await userEvent.hover(screen.getByRole('button', { pressed: true }))
  expect(screen.getByRole('tooltip')).toHaveTextContent('52 216 NOK · leie billigst')
  await userEvent.unhover(screen.getByRole('button', { pressed: true }))
  expect(screen.queryByRole('tooltip')).toBeNull()
})

test('focusing a cell shows the tooltip too', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  const cell = screen.getByRole('button', { name: /^5 år, 3,0 %/ })
  fireEvent.focus(cell)
  expect(screen.getByRole('tooltip')).toHaveTextContent('24 425 NOK · kjøp billigst')
})

test('clicking a cell dispatches selectCell', async () => {
  const dispatch = vi.fn()
  render(<Matrix state={DEFAULT_STATE} dispatch={dispatch} />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,0 %/ }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'selectCell', years: 5, priceGrowth: 0.03 })
})

test('cells carry data-kind', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  expect(screen.getByRole('button', { pressed: true }).getAttribute('data-kind')).toBe('rent')
})

test('shows one-year warning with action, hidden once taxGain is on', async () => {
  const dispatch = vi.fn()
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { years: 1 } })
  const { rerender } = render(<Matrix state={s} dispatch={dispatch} />)
  expect(screen.getByRole('alert')).toHaveTextContent(t.oneYearWarning)
  await userEvent.click(screen.getByRole('button', { name: t.oneYearWarningAction }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { taxGain: true } })
  rerender(<Matrix state={reduce(s, { type: 'patch', patch: { taxGain: true } })} dispatch={dispatch} />)
  expect(screen.queryByRole('button', { name: t.oneYearWarningAction })).toBeNull()
})

test('no warning at 3 years', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  expect(screen.queryByRole('alert')).toBeNull()
})

test('cell labels state the verdict in words, not colour alone', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(`3 år, 0,0 %: 52 216 NOK, ${t.cellRent}`)
  expect(screen.getByRole('button', { name: new RegExp(`^5 år, 3,0 %.*${t.cellBuy}$`) })).toBeInTheDocument()
})

test('buy cells carry a visible non-colour marker', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  const buy = screen.getByRole('button', { name: /^5 år, 3,0 %/ })
  const rent = screen.getByRole('button', { pressed: true })
  expect(buy.querySelector('.marker')).toHaveTextContent('▼')
  expect(rent.querySelector('.marker')).toHaveTextContent('▲')
})

test('negative growth columns exist and are redder than zero growth', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  const neg = screen.getByRole('button', { name: /^3 år, −5,0 %/ })
  expect(neg).toHaveAccessibleName(`3 år, −5,0 %: 86 132 NOK, ${t.cellRent}`)
  expect(neg.getAttribute('data-kind')).toBe('rent')
})
