import { DEFAULT_INPUTS } from '../model/defaults'
import type { Inputs, OwnershipType } from '../model/types'
import { clamp, clampInputs, NUMERIC_KEYS, type Limit, type NumericKey } from '../model/validate'
import { DEFAULT_STATE, type AppState } from './types'

export const PERCENT_KEYS: ReadonlyArray<keyof Inputs> = [
  'rate', 'taxRate', 'priceGrowth', 'inflation', 'altReturn',
  'docFeeRate', 'sellCostRate', 'maintenanceRate', 'rentGrowth',
]

export const START_RENT_LIMITS: Limit = { min: 0, max: 300_000, step: 500 }

const OWNERSHIP_TYPES: ReadonlyArray<OwnershipType> = ['selveier', 'borettslag']
const percentSet = new Set<keyof Inputs>(PERCENT_KEYS)

const toDisplay = (key: NumericKey, v: number): string =>
  percentSet.has(key) ? String(Math.round(v * 100 * 100) / 100) : String(Math.round(v))

const fromDisplay = (key: NumericKey, raw: string): number | null => {
  const n = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(n)) return null
  return percentSet.has(key) ? n / 100 : n
}

/** Only fields that differ from the defaults, in Inputs declaration order, then startRent. */
export function serialize(state: AppState): URLSearchParams {
  const params = new URLSearchParams()
  const { inputs, startRent } = state
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]) {
    if (inputs[key] === DEFAULT_INPUTS[key]) continue
    if (key === 'ownershipType') params.set('type', inputs.ownershipType)
    else if (key === 'taxGain') params.set('taxGain', '1')
    else params.set(key, toDisplay(key, inputs[key]))
  }
  if (startRent !== DEFAULT_STATE.startRent) params.set('startRent', String(Math.round(startRent)))
  return params
}

/** Defaults applied, unknown keys and junk ignored, values clamped. */
export function parse(params: URLSearchParams): AppState {
  const inputs: Inputs = { ...DEFAULT_INPUTS }
  const type = params.get('type')
  if (type && (OWNERSHIP_TYPES as string[]).includes(type)) inputs.ownershipType = type as OwnershipType
  if (params.get('taxGain') === '1') inputs.taxGain = true
  for (const key of NUMERIC_KEYS) {
    const raw = params.get(key)
    if (raw === null) continue
    const v = fromDisplay(key, raw)
    if (v !== null) inputs[key] = v
  }
  let startRent = DEFAULT_STATE.startRent
  const rawRent = params.get('startRent')
  if (rawRent !== null) {
    const n = Number(rawRent)
    if (rawRent.trim() !== '' && Number.isFinite(n)) startRent = clamp(n, START_RENT_LIMITS)
  }
  return { inputs: clampInputs(inputs), startRent }
}

