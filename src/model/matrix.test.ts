import { breakEvenMatrix, MATRIX_GROWTHS, MATRIX_YEARS } from './matrix'
import { DEFAULT_INPUTS } from './defaults'

const d = DEFAULT_INPUTS

test('matrix axes', () => {
  expect(MATRIX_YEARS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  expect(MATRIX_GROWTHS).toHaveLength(11)
  expect(MATRIX_GROWTHS[0]).toBe(0)
  expect(MATRIX_GROWTHS[7]).toBeCloseTo(0.035, 10)
  expect(MATRIX_GROWTHS[10]).toBeCloseTo(0.05, 10)
})

test('matrix shape and corner values', () => {
  const m = breakEvenMatrix(d)
  expect(m).toHaveLength(10)
  expect(m[0]).toHaveLength(11)
  expect(Math.abs(m[2][0] - 52216)).toBeLessThanOrEqual(1)
  expect(Math.abs(m[4][7] - 20492)).toBeLessThanOrEqual(1)
})
