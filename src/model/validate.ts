import type { Inputs } from './types'

export type NumericKey = keyof Omit<Inputs, 'ownershipType' | 'taxGain'>

export interface Limit {
  min: number
  max: number
  step: number
}

export const LIMITS: Record<NumericKey, Limit> = {
  price: { min: 0, max: 50_000_000, step: 100_000 },
  equity: { min: 0, max: 50_000_000, step: 100_000 },
  rate: { min: 0, max: 0.2, step: 0.0025 },
  loanYears: { min: 1, max: 40, step: 1 },
  taxRate: { min: 0, max: 1, step: 0.01 },
  years: { min: 1, max: 10, step: 1 },
  priceGrowth: { min: -0.1, max: 0.2, step: 0.005 },
  inflation: { min: 0, max: 0.2, step: 0.005 },
  altReturn: { min: 0, max: 0.2, step: 0.005 },
  docFeeRate: { min: 0, max: 0.1, step: 0.005 },
  registrationFee: { min: 0, max: 100_000, step: 100 },
  bankFee: { min: 0, max: 100_000, step: 500 },
  sellCostRate: { min: 0, max: 0.1, step: 0.005 },
  maintenanceRate: { min: 0, max: 0.05, step: 0.0025 },
  insurance: { min: 0, max: 200_000, step: 1_000 },
  municipalFees: { min: 0, max: 200_000, step: 1_000 },
  propertyTax: { min: 0, max: 200_000, step: 1_000 },
  commonCosts: { min: 0, max: 500_000, step: 1_000 },
  rentGrowth: { min: 0, max: 0.2, step: 0.005 },
}

const INTEGER_KEYS: ReadonlySet<NumericKey> = new Set(['years', 'loanYears'])

export const NUMERIC_KEYS = Object.keys(LIMITS) as NumericKey[]

export function clamp(value: number, limit: Limit): number {
  if (!Number.isFinite(value)) return limit.min
  return Math.min(limit.max, Math.max(limit.min, value))
}

export function clampInputs(inputs: Inputs): Inputs {
  const out: Inputs = { ...inputs }
  for (const key of NUMERIC_KEYS) {
    let v = clamp(inputs[key], LIMITS[key])
    if (INTEGER_KEYS.has(key)) v = Math.round(v)
    out[key] = v
  }
  if (out.equity > out.price) out.equity = out.price
  return out
}
