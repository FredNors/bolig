import type { Inputs } from './types'

// Declaration order matters: URL serialization iterates these keys in order.
export const DEFAULT_INPUTS: Inputs = {
  ownershipType: 'selveier',
  price: 9_000_000,
  equity: 2_000_000,
  rate: 0.06,
  loanYears: 30,
  taxRate: 0.22,
  years: 3,
  priceGrowth: 0,
  inflation: 0.03,
  altReturn: 0.03,
  docFeeRate: 0.025,
  registrationFee: 1_090,
  bankFee: 5_000,
  sellCostRate: 0.02,
  maintenanceRate: 0.01,
  insurance: 15_000,
  municipalFees: 18_000,
  propertyTax: 0,
  commonCosts: 0,
  taxGain: false,
  rentGrowth: 0.03,
}

export const DEFAULT_START_RENT = 35_000
export const GAIN_TAX_RATE = 0.22
