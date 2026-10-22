import { computeOwnCost } from './ownCost'
import type { Inputs } from './types'

const GROWTH_MIN = -0.10
const GROWTH_MAX = 0.20
const ITERATIONS = 60
const MAX_YEARS = 10

/** Annual price growth at which owning costs the same as renting at startRent. Null when outside [-10 %, +20 %]. */
export function requiredGrowth(inputs: Inputs, startRent: number): number | null {
  const target = startRent * computeOwnCost(inputs).rentFactor
  const f = (g: number) => computeOwnCost({ ...inputs, priceGrowth: g }).ownCost - target
  if (f(GROWTH_MIN) <= 0) return null
  if (f(GROWTH_MAX) > 0) return null
  let lo = GROWTH_MIN
  let hi = GROWTH_MAX
  let mid = (lo + hi) / 2
  for (let i = 0; i < ITERATIONS; i++) {
    mid = (lo + hi) / 2
    if (f(mid) > 0) lo = mid
    else hi = mid
  }
  return mid
}

/** First holding period (1..10 years) where owning is at most as expensive as renting. Null if none. */
export function minYearsToBreakEven(inputs: Inputs, startRent: number): number | null {
  for (let years = 1; years <= MAX_YEARS; years++) {
    const r = computeOwnCost({ ...inputs, years })
    if (r.ownCost <= startRent * r.rentFactor) return years
  }
  return null
}
