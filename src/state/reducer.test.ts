import { reduce } from './reducer'
import { DEFAULT_STATE } from './types'

test('patch clamps', () => {
  expect(reduce(DEFAULT_STATE, { type: 'patch', patch: { years: 99 } }).inputs.years).toBe(10)
})

test('switching to selveier clears commonCosts', () => {
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { ownershipType: 'borettslag', commonCosts: 48000 } })
  expect(s.inputs.commonCosts).toBe(48000)
  expect(reduce(s, { type: 'patch', patch: { ownershipType: 'selveier' } }).inputs.commonCosts).toBe(0)
})

test('selectCell sets years and growth', () => {
  const s = reduce(DEFAULT_STATE, { type: 'selectCell', years: 5, priceGrowth: 0.035 })
  expect(s.inputs.years).toBe(5)
  expect(s.inputs.priceGrowth).toBe(0.035)
})

test('setStartRent clamps', () => {
  expect(reduce(DEFAULT_STATE, { type: 'setStartRent', value: -5 }).startRent).toBe(0)
  expect(reduce(DEFAULT_STATE, { type: 'setStartRent', value: 40000 }).startRent).toBe(40000)
})
