import { GAIN_TAX_RATE } from './defaults'
import type { Inputs, OwnCostResult } from './types'

const geometricSum = (base: number, growth: number, terms: number): number => {
  let sum = 0
  for (let y = 0; y < terms; y++) sum += base * (1 + growth) ** y
  return sum
}

export function computeOwnCost(inputs: Inputs): OwnCostResult {
  const {
    ownershipType, price, equity: rawEquity, rate, loanYears, taxRate, years, priceGrowth,
    inflation, altReturn, docFeeRate, registrationFee, bankFee, sellCostRate,
    maintenanceRate, insurance, municipalFees, propertyTax, commonCosts, taxGain, rentGrowth,
  } = inputs

  const effectiveDocFeeRate = ownershipType === 'borettslag' ? 0 : docFeeRate
  const equity = Math.min(rawEquity, price) // more equity than price is simply unused
  const loan = price - equity
  const rm = (1 + rate) ** (1 / 12) - 1
  const n = loanYears * 12
  const pmt = rm === 0 ? loan / n : (loan * rm) / (1 - (1 + rm) ** -n)

  let bal = loan
  let totalInterest = 0
  for (let m = 0; m < years * 12 && bal > 0; m++) {
    const interest = bal * rm
    totalInterest += interest
    bal = Math.max(0, bal - (pmt - interest))
  }
  const principalPaid = loan - bal

  const netInterest = totalInterest * (1 - taxRate)
  const buyCosts = price * effectiveDocFeeRate + registrationFee + bankFee
  const salePrice = price * (1 + priceGrowth) ** years
  const sellCosts = salePrice * sellCostRate
  const grossGain = salePrice - price
  const gain = taxGain ? grossGain * (1 - GAIN_TAX_RATE) : grossGain
  const runningYear0 = price * maintenanceRate + insurance + municipalFees + propertyTax + commonCosts
  const running = geometricSum(runningYear0, inflation, years)
  const opportunity = (equity + buyCosts) * ((1 + altReturn) ** years - 1)

  const ownCost = netInterest + buyCosts + sellCosts + running + opportunity - gain
  const rentFactor = geometricSum(12, rentGrowth, years)

  return {
    pmt, totalInterest, netInterest, principalPaid, buyCosts, salePrice, grossGain, gain,
    sellCosts, running, opportunity, ownCost, rentFactor,
    breakEvenRent: ownCost / rentFactor,
    cashNeeded: equity + buyCosts,
  }
}
