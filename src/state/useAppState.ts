import { useEffect, useReducer, useRef } from 'react'
import { reduce, type Action } from './reducer'
import { parse, serialize } from './urlState'
import type { AppState } from './types'

/** Delay before mirroring state to the URL; keeps slider drags under WebKit's replaceState rate limit. */
const URL_WRITE_DELAY_MS = 250

function writeUrl(state: AppState) {
  const query = serialize(state).toString()
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname
  try {
    window.history.replaceState(null, '', url)
  } catch {
    // Safari throws SecurityError when replaceState is called too often; the next write will catch up.
  }
}

export function useAppState(): { state: AppState; dispatch: (a: Action) => void } {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    parse(new URLSearchParams(window.location.search)),
  )
  const isFirstWrite = useRef(true)

  useEffect(() => {
    if (isFirstWrite.current) {
      // Normalise a junk or partial URL immediately on load.
      isFirstWrite.current = false
      writeUrl(state)
      return
    }
    const timer = window.setTimeout(() => writeUrl(state), URL_WRITE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  return { state, dispatch }
}
