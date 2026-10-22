import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { t } from './i18n/nb'

beforeEach(() => window.history.replaceState(null, '', '/'))

test('renders app title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leie eller kjøpe?')
})

test('changing startRent recolours the selected cell', () => {
  render(<App />)
  const cell = () => screen.getByRole('button', { pressed: true })
  expect(cell().getAttribute('data-kind')).toBe('rent')
  const rent = screen.getByLabelText(t.labelStartRent)
  fireEvent.change(rent, { target: { value: '60000' } })
  fireEvent.blur(rent)
  expect(cell().getAttribute('data-kind')).toBe('buy')
})

test('clicking a cell updates the breakdown', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 305 538 kr')
  expect(window.location.search).toBe('?years=5&priceGrowth=3.5')
})

test('caveats are listed', () => {
  render(<App />)
  const items = screen.getAllByRole('listitem').filter((li) => (t.caveats as readonly string[]).includes(li.textContent ?? ''))
  expect(items).toHaveLength(t.caveats.length)
})
