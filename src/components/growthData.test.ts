import { growthSeries } from './growthData'
import { DEFAULT_INPUTS } from '../model/defaults'

const d = DEFAULT_INPUTS

test('series has 10 points and matches reference at 3 and 10 years', () => {
  const s = growthSeries(d, 35000)
  expect(s).toHaveLength(10)
  expect(s[2]).toMatchObject({ years: 3 })
  expect(s[2].growth).toBeCloseTo(0.0236, 4)
  expect(s[9].growth).toBeCloseTo(0.0079, 4)
})

test('unreachable years are null', () => {
  // At 200 000 kr/mnd buying wins even at -10 % growth for every holding period.
  expect(growthSeries(d, 200000).every((p) => p.growth === null)).toBe(true)
})
