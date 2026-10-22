import { act, renderHook } from '@testing-library/react'
import { useAppState } from './useAppState'

beforeEach(() => {
  vi.useFakeTimers()
  window.history.replaceState(null, '', '/?years=5')
})
afterEach(() => vi.useRealTimers())

test('reads initial state from URL and writes changes back after a short delay', () => {
  const { result } = renderHook(() => useAppState())
  expect(result.current.state.inputs.years).toBe(5)
  act(() => result.current.dispatch({ type: 'setStartRent', value: 40000 }))
  act(() => vi.advanceTimersByTime(500))
  expect(window.location.search).toBe('?years=5&startRent=40000')
})

test('defaults leave the URL without a query', () => {
  const { result } = renderHook(() => useAppState())
  act(() => result.current.dispatch({ type: 'patch', patch: { years: 3 } }))
  act(() => vi.advanceTimersByTime(500))
  expect(window.location.search).toBe('')
})

test('rapid changes are coalesced into one URL write', () => {
  const spy = vi.spyOn(window.history, 'replaceState')
  const { result } = renderHook(() => useAppState())
  spy.mockClear()
  act(() => {
    for (let i = 1; i <= 50; i++) result.current.dispatch({ type: 'setStartRent', value: 30000 + i * 50 })
  })
  act(() => vi.advanceTimersByTime(500))
  expect(spy).toHaveBeenCalledTimes(1)
  expect(window.location.search).toBe('?years=5&startRent=32500')
  spy.mockRestore()
})

test('a throwing replaceState does not crash the app', () => {
  const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
    throw new DOMException('rate limited', 'SecurityError')
  })
  const { result } = renderHook(() => useAppState())
  act(() => result.current.dispatch({ type: 'setStartRent', value: 40000 }))
  expect(() => act(() => vi.advanceTimersByTime(500))).not.toThrow()
  expect(result.current.state.startRent).toBe(40000)
  spy.mockRestore()
})
