import { parse, serialize } from './urlState'
import { DEFAULT_STATE } from './types'
import { DEFAULT_INPUTS } from '../model/defaults'
import type { AppState } from './types'

const d = DEFAULT_INPUTS

test('defaults serialize to empty query', () => {
  expect(serialize(DEFAULT_STATE).toString()).toBe('')
})

test('non-default fields serialize as percent / amounts', () => {
  const s: AppState = {
    inputs: { ...d, price: 7500000, rate: 0.055, ownershipType: 'borettslag', taxGain: true },
    startRent: 30000,
  }
  expect(serialize(s).toString()).toBe('type=borettslag&price=7500000&rate=5.5&taxGain=1&startRent=30000')
})

test('round trip', () => {
  const s: AppState = {
    inputs: { ...d, years: 5, priceGrowth: 0.025, commonCosts: 48000 },
    startRent: 40000,
  }
  expect(parse(serialize(s))).toEqual(s)
})

test('junk is ignored and values clamped', () => {
  const p = parse(new URLSearchParams('years=abc&price=-5&foo=1&rate=99&type=villa'))
  expect(p.inputs.years).toBe(d.years)
  expect(p.inputs.price).toBe(0)
  expect(p.inputs.rate).toBe(0.2)
  expect(p.inputs.ownershipType).toBe('selveier')
})

test('empty query parses to defaults', () => {
  expect(parse(new URLSearchParams(''))).toEqual(DEFAULT_STATE)
})
