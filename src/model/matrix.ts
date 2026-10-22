import { computeOwnCost } from './ownCost'
import type { Inputs } from './types'

export const MATRIX_YEARS: number[] = Array.from({ length: 10 }, (_, i) => i + 1)
/** −5 % to +5 % in whole-percent steps; rounded so cells match a typed priceGrowth exactly. */
export const MATRIX_GROWTHS: number[] = Array.from({ length: 11 }, (_, i) => Math.round((i - 5)) / 100)

/** breakEvenRent per [yearIdx][growthIdx]. */
export function breakEvenMatrix(
  inputs: Inputs,
  years: number[] = MATRIX_YEARS,
  growths: number[] = MATRIX_GROWTHS,
): number[][] {
  return years.map((y) =>
    growths.map((g) => computeOwnCost({ ...inputs, years: y, priceGrowth: g }).breakEvenRent),
  )
}
