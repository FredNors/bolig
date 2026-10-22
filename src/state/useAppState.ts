import { useEffect, useReducer } from 'react'
import { reduce, type Action } from './reducer'
import { parse, serialize } from './urlState'
import type { AppState } from './types'

export function useAppState(): { state: AppState; dispatch: (a: Action) => void } {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    parse(new URLSearchParams(window.location.search)),
  )

  useEffect(() => {
    const query = serialize(state).toString()
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [state])

  return { state, dispatch }
}
