import { cellStyle, cellTone } from './matrixColor'

test('below rent is buy, intensity scales', () => {
  expect(cellTone(30000, 35000)).toEqual({ kind: 'buy', intensity: expect.closeTo(5000 / 17500, 5) })
  expect(cellTone(70000, 35000)).toEqual({ kind: 'rent', intensity: 1 })
})

test('zero rent gives full red without NaN', () => {
  expect(cellTone(30000, 0)).toEqual({ kind: 'rent', intensity: 1 })
})

test('cellStyle interpolates from pale to saturated and flips text colour when dark', () => {
  const pale = cellStyle({ kind: 'buy', intensity: 0 })
  const strong = cellStyle({ kind: 'buy', intensity: 1 })
  expect(pale.background).not.toBe(strong.background)
  expect(pale.color).toBe('var(--text)')
  expect(strong.color).toBe('#fff')
  expect(cellStyle({ kind: 'rent', intensity: 1 }).background).not.toBe(strong.background)
})
