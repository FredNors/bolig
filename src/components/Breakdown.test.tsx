import { render, screen } from '@testing-library/react'
import { Breakdown } from './Breakdown'
import { computeOwnCost } from '../model/ownCost'
import { DEFAULT_INPUTS } from '../model/defaults'
import { t } from '../i18n/nb'

const d = DEFAULT_INPUTS

test('table shows segments and total', () => {
  const r = computeOwnCost({ ...d, years: 3 })
  render(<Breakdown result={r} years={3} priceGrowth={0} />)
  expect(screen.getByText(t.segInterest).nextSibling).toHaveTextContent('938 597 NOK')
  expect(screen.getByText(t.segRunning).nextSibling).toHaveTextContent('380 181 NOK')
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 936 750 NOK')
})

test('heading names the selected cell', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035 })
  render(<Breakdown result={r} years={5} priceGrowth={0.035} />)
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('5 år, 3,5 %')
})
