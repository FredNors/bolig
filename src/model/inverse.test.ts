import { minYearsToBreakEven, requiredGrowth } from './inverse'
import { DEFAULT_INPUTS } from './defaults'

const d = DEFAULT_INPUTS

test.each([[3, 0.0236], [5, 0.0161], [7, 0.0121], [10, 0.0079]])(
  'required growth at 35 000 for %i years', (years, expected) => {
    expect(requiredGrowth({ ...d, years }, 35000)).toBeCloseTo(expected, 4)
  })

test('requiredGrowth is null when buying wins even at -10 %', () => {
  expect(requiredGrowth({ ...d, years: 10 }, 200000)).toBeNull()
})

test('requiredGrowth is null when renting wins even at +20 %', () => {
  // Running costs so high that even a 20 % gain over one year cannot cover them.
  expect(requiredGrowth({ ...d, years: 1, insurance: 2_000_000 }, 1000)).toBeNull()
})

test('minYearsToBreakEven at 35 000 and 3 % growth', () => {
  expect(minYearsToBreakEven({ ...d, priceGrowth: 0.03 }, 35000)).toBe(3)
})

test('minYearsToBreakEven is null at 0 % growth', () => {
  expect(minYearsToBreakEven({ ...d, priceGrowth: 0 }, 35000)).toBeNull()
})
