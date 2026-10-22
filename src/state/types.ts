import { DEFAULT_INPUTS, DEFAULT_START_RENT } from '../model/defaults'
import type { Inputs } from '../model/types'

export interface AppState {
  inputs: Inputs
  startRent: number
}

export const DEFAULT_STATE: AppState = {
  inputs: DEFAULT_INPUTS,
  startRent: DEFAULT_START_RENT,
}
