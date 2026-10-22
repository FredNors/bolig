import { computeOwnCost } from './ownCost'
import { DEFAULT_INPUTS } from './defaults'

const d = DEFAULT_INPUTS
const near = (a: number, b: number, tol = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol)

test('3 years, 0 % growth matches reference partials', () => {
  const r = computeOwnCost({ ...d, years: 3, priceGrowth: 0 })
  near(r.pmt, 41256)
  near(r.totalInterest, 1203330)
  near(r.netInterest, 938597)
  near(r.buyCosts, 231090)
  near(r.sellCosts, 180000)
  near(r.running, 380181)
  near(r.opportunity, 206882)
  near(r.ownCost, 1936750)
  near(r.breakEvenRent, 52216)
  near(r.cashNeeded, 2231090)
})

test('5 years, 3.5 % growth matches reference partials', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035 })
  near(r.totalInterest, 1976234)
  near(r.netInterest, 1541463)
  near(r.salePrice, 10689177)
  near(r.gain, 1689177)
  near(r.sellCosts, 213784)
  near(r.running, 653024)
  near(r.opportunity, 355355)
  near(r.ownCost, 1305538)
  near(r.breakEvenRent, 20492)
})

test.each([
  [1, 0, 76510, 1], [1, 0.01, 69200, 100], [1, 0.02, 61800, 100], [1, 0.03, 54500, 100], [1, 0.035, 50785, 1],
  [2, 0, 58567, 1], [2, 0.01, 51300, 100], [2, 0.02, 43900, 100], [2, 0.03, 36500, 100], [2, 0.035, 32779, 1],
  [3, 0, 52216, 1], [3, 0.01, 45000, 100], [3, 0.02, 37700, 100], [3, 0.03, 30200, 100], [3, 0.035, 26364, 1],
  [5, 0, 46475, 1], [5, 0.01, 39400, 100], [5, 0.02, 32100, 100], [5, 0.03, 24400, 100], [5, 0.035, 20492, 1],
])('break-even rent %i years, growth %f', (years, priceGrowth, expected, tol) => {
  near(computeOwnCost({ ...d, years, priceGrowth }).breakEvenRent, expected, tol)
})

test('borettslag removes dokumentavgift from buyCosts', () => {
  near(computeOwnCost({ ...d, ownershipType: 'borettslag' }).buyCosts, 6090)
})

test('taxGain reduces gain by 22 %', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035, taxGain: true })
  near(r.gain, 1689177 * 0.78)
})

test('negative growth gives negative gain and higher ownCost', () => {
  const base = computeOwnCost({ ...d, years: 3 }).ownCost
  const r = computeOwnCost({ ...d, years: 3, priceGrowth: -0.02 })
  expect(r.gain).toBeLessThan(0)
  expect(r.ownCost).toBeGreaterThan(base)
})

test('rate 0 gives linear payment and no interest', () => {
  const r = computeOwnCost({ ...d, rate: 0 })
  near(r.pmt, 7000000 / 360)
  near(r.totalInterest, 0)
})

test('loan repaid before sale stops accruing interest', () => {
  const r = computeOwnCost({ ...d, loanYears: 1, years: 3 })
  const oneYear = computeOwnCost({ ...d, loanYears: 1, years: 1 })
  near(r.totalInterest, oneYear.totalInterest, 1)
  near(r.principalPaid, 7000000, 1)
})
