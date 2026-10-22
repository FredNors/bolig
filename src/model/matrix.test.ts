import { breakEvenMatrix, MATRIX_GROWTHS, MATRIX_YEARS } from './matrix'
import { DEFAULT_INPUTS } from './defaults'

const d = DEFAULT_INPUTS

test('matrix axes', () => {
  expect(MATRIX_YEARS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  expect(MATRIX_GROWTHS).toHaveLength(11)
  expect(MATRIX_GROWTHS[0]).toBeCloseTo(-0.05, 10)
  expect(MATRIX_GROWTHS[5]).toBeCloseTo(0, 10)
  expect(MATRIX_GROWTHS[8]).toBeCloseTo(0.03, 10)
  expect(MATRIX_GROWTHS[10]).toBeCloseTo(0.05, 10)
})

test('matrix shape and corner values', () => {
  const m = breakEvenMatrix(d)
  expect(m).toHaveLength(10)
  expect(m[0]).toHaveLength(11)
  expect(Math.abs(m[2][5] - 52216)).toBeLessThanOrEqual(1)   // 3 years, 0 %
  expect(Math.abs(m[4][8] - 24425)).toBeLessThanOrEqual(1)   // 5 years, 3 %
  expect(m[0][0]).toBeGreaterThan(m[0][5])                   // falling prices make owning dearer
})
