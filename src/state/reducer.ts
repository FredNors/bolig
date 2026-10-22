import type { Inputs } from '../model/types'
import { clamp, clampInputs } from '../model/validate'
import { START_RENT_LIMITS } from './urlState'
import type { AppState } from './types'

export type Action =
  | { type: 'patch'; patch: Partial<Inputs> }
  | { type: 'setStartRent'; value: number }
  | { type: 'selectCell'; years: number; priceGrowth: number }

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'patch': {
      const next: Inputs = { ...state.inputs, ...action.patch }
      if (action.patch.ownershipType === 'selveier' && state.inputs.ownershipType !== 'selveier') {
        next.commonCosts = 0
      }
      return { ...state, inputs: clampInputs(next) }
    }
    case 'setStartRent':
      return { ...state, startRent: clamp(action.value, START_RENT_LIMITS) }
    case 'selectCell':
      return reduce(state, { type: 'patch', patch: { years: action.years, priceGrowth: action.priceGrowth } })
  }
}
