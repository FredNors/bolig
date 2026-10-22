import { breakdownSegments } from './breakdownData'
import { computeOwnCost } from '../model/ownCost'
import { DEFAULT_INPUTS } from '../model/defaults'

const d = DEFAULT_INPUTS

test('segments sum to ownCost', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035 })
  const segs = breakdownSegments(r)
  expect(segs.map((s) => s.key)).toEqual(['interest', 'buy', 'sell', 'running', 'opportunity', 'gain'])
  expect(Math.abs(segs.reduce((a, s) => a + s.value, 0) - r.ownCost)).toBeLessThan(1)
  expect(segs[5].value).toBeLessThan(0)
})

test('gain segment is positive when the price falls', () => {
  const r = computeOwnCost({ ...d, years: 3, priceGrowth: -0.02 })
  expect(breakdownSegments(r)[5].value).toBeGreaterThan(0)
})
