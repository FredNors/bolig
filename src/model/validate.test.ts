import { clampInputs, LIMITS } from './validate'
import { DEFAULT_INPUTS } from './defaults'

const d = DEFAULT_INPUTS

test('clamps years to 1..10 and rounds to integer', () => {
  expect(clampInputs({ ...d, years: 14.6 }).years).toBe(10)
  expect(clampInputs({ ...d, years: 2.4 }).years).toBe(2)
})

test('equity above price is kept as typed (the model caps it)', () => {
  expect(clampInputs({ ...d, price: 5e6, equity: 6e6 }).equity).toBe(6e6)
})

test('rate is clamped to its limit', () => {
  expect(clampInputs({ ...d, rate: 0.99 }).rate).toBe(LIMITS.rate.max)
  expect(clampInputs({ ...d, rate: -1 }).rate).toBe(0)
})

test('defaults are unchanged by clamping', () => {
  expect(clampInputs(d)).toEqual(d)
})
