import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

test('clicking a cell opens the detail panel with that cell, and another click switches it', async () => {
  render(<App />)
  expect(screen.queryByRole('dialog', { name: t.breakdownTitle })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  const panel = screen.getByRole('dialog', { name: t.breakdownTitle })
  expect(panel).toHaveTextContent('5 år, 3,5 %')
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 305 538 NOK')
  await waitFor(() => expect(window.location.search).toBe('?years=5&priceGrowth=3.5'))
  await userEvent.click(screen.getByRole('button', { name: /^3 år, 0,0 %/ }))
  expect(screen.getByRole('dialog', { name: t.breakdownTitle })).toHaveTextContent('3 år, 0,0 %')
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 936 750 NOK')
})

test('the detail panel closes with the close button and with Escape', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  await userEvent.click(screen.getByRole('button', { name: t.close }))
  expect(screen.queryByRole('dialog', { name: t.breakdownTitle })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  expect(screen.getByRole('dialog', { name: t.breakdownTitle })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: t.breakdownTitle })).toBeNull()
})

test('the matrix stays clickable while the panel is open (non-modal)', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  await userEvent.click(screen.getByRole('button', { name: /^2 år, 1,0 %/ }))
  expect(screen.getByRole('dialog', { name: t.breakdownTitle })).toHaveTextContent('2 år, 1,0 %')
})

test('caveats are listed', () => {
  render(<App />)
  const items = screen.getAllByRole('listitem').filter((li) => (t.caveats as readonly string[]).includes(li.textContent ?? ''))
  expect(items).toHaveLength(t.caveats.length)
})
