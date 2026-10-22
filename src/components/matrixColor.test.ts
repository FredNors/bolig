import { cellStyle, cellTone } from './matrixColor'

test('below rent is buy, intensity scales', () => {
  expect(cellTone(30000, 35000)).toEqual({ kind: 'buy', intensity: expect.closeTo(5000 / 17500, 5) })
  expect(cellTone(70000, 35000)).toEqual({ kind: 'rent', intensity: 1 })
})

test('zero rent gives full red without NaN', () => {
  expect(cellTone(30000, 0)).toEqual({ kind: 'rent', intensity: 1 })
})

test('cellStyle produces an rgba background', () => {
  expect(cellStyle({ kind: 'buy', intensity: 1 }).background).toMatch(/^rgba\(/)
})
