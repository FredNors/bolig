export type OwnershipType = 'selveier' | 'borettslag'

export interface Inputs {
  ownershipType: OwnershipType
  price: number
  equity: number
  rate: number
  loanYears: number
  taxRate: number
  years: number
  priceGrowth: number
  inflation: number
  altReturn: number
  docFeeRate: number
  registrationFee: number
  bankFee: number
  sellCostRate: number
  maintenanceRate: number
  insurance: number
  municipalFees: number
  propertyTax: number
  commonCosts: number
  taxGain: boolean
  rentGrowth: number
}

export interface OwnCostResult {
  pmt: number
  totalInterest: number
  netInterest: number
  principalPaid: number
  buyCosts: number
  salePrice: number
  grossGain: number
  gain: number
  sellCosts: number
  running: number
  opportunity: number
  ownCost: number
  rentFactor: number
  breakEvenRent: number
  cashNeeded: number
}
