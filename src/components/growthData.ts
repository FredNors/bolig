import { requiredGrowth } from '../model/inverse'
import { MATRIX_YEARS } from '../model/matrix'
import type { Inputs } from '../model/types'

export interface GrowthPoint {
  years: number
  growth: number | null
}

/** Required annual price growth per holding period (1..10 years); null where unreachable. */
export function growthSeries(inputs: Inputs, startRent: number): GrowthPoint[] {
  return MATRIX_YEARS.map((years) => ({ years, growth: requiredGrowth({ ...inputs, years }, startRent) }))
}
