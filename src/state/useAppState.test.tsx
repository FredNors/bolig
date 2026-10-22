import { act, renderHook } from '@testing-library/react'
import { useAppState } from './useAppState'

test('reads initial state from URL and writes changes back', () => {
  window.history.replaceState(null, '', '/?years=5')
  const { result } = renderHook(() => useAppState())
  expect(result.current.state.inputs.years).toBe(5)
  act(() => result.current.dispatch({ type: 'setStartRent', value: 40000 }))
  expect(window.location.search).toBe('?years=5&startRent=40000')
})

test('defaults leave the URL without a query', () => {
  window.history.replaceState(null, '', '/?years=5')
  const { result } = renderHook(() => useAppState())
  act(() => result.current.dispatch({ type: 'patch', patch: { years: 3 } }))
  expect(window.location.search).toBe('')
})
