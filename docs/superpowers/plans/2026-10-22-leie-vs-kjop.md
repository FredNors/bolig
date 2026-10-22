# Leie vs. kjøp simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static React app that shows the break-even rent between renting and buying a home in Norway, with a shareable URL, deployed to GitHub Pages.

**Architecture:** A framework-free model module (`src/model/`) computes everything from one `Inputs` object; a single `useAppState` hook owns state and mirrors it to the URL; four presentational components render the matrix, breakdown, growth curve and input panel from props. Tests pin the model to the reference numbers before any UI exists.

**Tech Stack:** Vite 6, React 18, TypeScript 5, Vitest, @testing-library/react, jsdom, Recharts 2, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-10-22-leie-vs-kjop-design.md`

## Global Constraints

- Node 22, npm. No backend, no runtime data fetching.
- `src/model/` imports nothing from React or the DOM.
- All UI copy lives in `src/i18n/nb.ts` (norsk bokmål). Components never hold literal UI strings.
- Numbers: `Intl.NumberFormat('nb-NO')`; amounts as `52 216 kr`, percentages as `2,36 %`.
- Percent inputs are stored as decimals (0.06) in state and shown/serialized as percent (6).
- `vite.config.ts` sets `base: '/bolig/'`.
- Commit after every task. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- The GitHub repo `FredNors/bolig` is created only after the user confirms (Task 12).

## Review Focus

1. `rate = 0` makes the monthly rate 0 and the annuity formula divide by zero; expected: payment = loan / n. Test in Task 2.
2. `loanYears < years` (loan repaid before sale) lets the balance go negative and interest turn negative; expected: simulation stops accruing once balance reaches 0. Test in Task 2.
3. `startRent = 0` makes the matrix colour ratio divide by zero; expected: every cell red at full intensity, no NaN. Test in Task 8.
4. A URL with junk (`years=abc&price=-5&foo=1`) must open the app on defaults, not crash. Test in Task 5.
5. `requiredGrowth` returning `null` (buying cheaper even at −10 %, or dearer even at +20 %) must show a gap in the curve and a sentence instead of `NaN %`. Test in Task 10.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `.gitignore`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `npm test` (Vitest, jsdom, RTL matchers), `npm run build` (output in `dist/`), `npm run dev`.

- [ ] **Step 1: Scaffold with Vite**

Run: `npm create vite@latest . -- --template react-ts` (answer yes to using the non-empty directory; keep `docs/`).
Then: `npm install` and `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event` and `npm install recharts`.

- [ ] **Step 2: Configure Vite and Vitest**

`vite.config.ts`: `base: '/bolig/'`, `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true }`. Add `/// <reference types="vitest" />` at top. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts. `tsconfig.json` adds `"types": ["vitest/globals", "@testing-library/jest-dom"]`.

- [ ] **Step 3: Write the smoke test**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'
test('renders app title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leie eller kjøpe?')
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (Vite template heading is "Vite + React").

- [ ] **Step 5: Replace `src/App.tsx` with a component rendering `<h1>Leie eller kjøpe?</h1>`; delete template CSS and assets**

Delete `src/assets/react.svg`, `public/vite.svg`, `src/App.css`; keep an empty `src/index.css`.

- [ ] **Step 6: Run test and build**

Run: `npm test && npm run build`
Expected: 1 test PASS; `dist/index.html` references `/bolig/assets/...`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React + Vitest project"
```

---

### Task 2: Model core: `computeOwnCost`

**Files:**
- Create: `src/model/types.ts`, `src/model/defaults.ts`, `src/model/ownCost.ts`
- Test: `src/model/ownCost.test.ts`

**Interfaces:**
- Produces:

```ts
// src/model/types.ts
export type OwnershipType = 'selveier' | 'borettslag'
export interface Inputs {
  ownershipType: OwnershipType
  price: number; equity: number; rate: number; loanYears: number; taxRate: number
  years: number; priceGrowth: number; inflation: number; altReturn: number
  docFeeRate: number; registrationFee: number; bankFee: number; sellCostRate: number
  maintenanceRate: number; insurance: number; municipalFees: number; propertyTax: number
  commonCosts: number; taxGain: boolean; rentGrowth: number
}
export interface OwnCostResult {
  pmt: number; totalInterest: number; netInterest: number; principalPaid: number
  buyCosts: number; salePrice: number; grossGain: number; gain: number; sellCosts: number
  running: number; opportunity: number; ownCost: number; rentFactor: number
  breakEvenRent: number; cashNeeded: number
}
// src/model/defaults.ts
export const DEFAULT_INPUTS: Inputs   // values from spec table
export const DEFAULT_START_RENT = 35000
export const GAIN_TAX_RATE = 0.22
// src/model/ownCost.ts
export function computeOwnCost(inputs: Inputs): OwnCostResult
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/model/ownCost.test.ts
import { computeOwnCost } from './ownCost'
import { DEFAULT_INPUTS } from './defaults'
const d = DEFAULT_INPUTS
const near = (a: number, b: number, tol = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol)

test('3 years, 0 % growth matches reference partials', () => {
  const r = computeOwnCost({ ...d, years: 3, priceGrowth: 0 })
  near(r.pmt, 41256); near(r.totalInterest, 1203330); near(r.netInterest, 938597)
  near(r.buyCosts, 231090); near(r.sellCosts, 180000); near(r.running, 380181)
  near(r.opportunity, 206882); near(r.ownCost, 1936750); near(r.breakEvenRent, 52216)
  near(r.cashNeeded, 2231090)
})
test('5 years, 3.5 % growth matches reference partials', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035 })
  near(r.totalInterest, 1976234); near(r.netInterest, 1541463); near(r.salePrice, 10689177)
  near(r.gain, 1689177); near(r.sellCosts, 213784); near(r.running, 653024)
  near(r.opportunity, 355355); near(r.ownCost, 1305538); near(r.breakEvenRent, 20492)
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
  expect(r.gain).toBeLessThan(0); expect(r.ownCost).toBeGreaterThan(base)
})
test('rate 0 gives linear payment and no interest', () => {
  const r = computeOwnCost({ ...d, rate: 0 })
  near(r.pmt, 7000000 / 360); near(r.totalInterest, 0)
})
test('loan repaid before sale stops accruing interest', () => {
  const r = computeOwnCost({ ...d, loanYears: 1, years: 3 })
  const oneYear = computeOwnCost({ ...d, loanYears: 1, years: 1 })
  near(r.totalInterest, oneYear.totalInterest, 1); near(r.principalPaid, 7000000, 1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/model`
Expected: FAIL, module `./ownCost` not found.

- [ ] **Step 3: Implement `types.ts`, `defaults.ts`, `computeOwnCost` per the spec's "Beregning" block**

Decisions the spec leaves open: when `rm === 0`, `pmt = loan / n`. In the monthly loop, `bal = Math.max(0, bal - (pmt - i))` and break when `bal === 0`. `effectiveDocFeeRate` is 0 for borettslag. `gain = taxGain ? grossGain * (1 - GAIN_TAX_RATE) : grossGain`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/model`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model
git commit -m "Add ownCost model with reference tests"
```

---

### Task 3: Inverse calculations and matrix

**Files:**
- Create: `src/model/inverse.ts`, `src/model/matrix.ts`
- Test: `src/model/inverse.test.ts`, `src/model/matrix.test.ts`

**Interfaces:**
- Consumes: `computeOwnCost`, `Inputs`, `DEFAULT_INPUTS`.
- Produces:

```ts
// src/model/inverse.ts
export function requiredGrowth(inputs: Inputs, startRent: number): number | null
export function minYearsToBreakEven(inputs: Inputs, startRent: number): number | null
// src/model/matrix.ts
export const MATRIX_YEARS: number[]      // [1..10]
export const MATRIX_GROWTHS: number[]    // [0, 0.005, ..., 0.05] (11 values)
export function breakEvenMatrix(inputs: Inputs, years?: number[], growths?: number[]): number[][]  // [yearIdx][growthIdx]
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/model/inverse.test.ts
test.each([[3, 0.0236], [5, 0.0161], [7, 0.0121], [10, 0.0079]])(
  'required growth at 35 000 for %i years', (years, expected) => {
    expect(requiredGrowth({ ...d, years }, 35000)).toBeCloseTo(expected, 4)
  })
test('requiredGrowth is null when buying wins even at -10 %', () => {
  expect(requiredGrowth({ ...d, years: 10 }, 200000)).toBeNull()
})
test('requiredGrowth is null when renting wins even at +20 %', () => {
  expect(requiredGrowth({ ...d, years: 1 }, 1000)).toBeNull()
})
test('minYearsToBreakEven at 35 000 and 3 % growth', () => {
  expect(minYearsToBreakEven({ ...d, priceGrowth: 0.03 }, 35000)).toBe(3)   // 2y: 36 517 > 35 000, 3y: 30 166 <= 35 000
})
test('minYearsToBreakEven is null at 0 % growth', () => {
  expect(minYearsToBreakEven({ ...d, priceGrowth: 0 }, 35000)).toBeNull()
})
// src/model/matrix.test.ts
test('matrix shape and corner values', () => {
  const m = breakEvenMatrix(d)
  expect(m).toHaveLength(10); expect(m[0]).toHaveLength(11)
  expect(Math.abs(m[2][0] - 52216)).toBeLessThanOrEqual(1)
  expect(Math.abs(m[4][7] - 20492)).toBeLessThanOrEqual(1)   // 5 years, 3.5 %
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/model`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`requiredGrowth`: target = `startRent * rentFactor` (rentFactor from `computeOwnCost(inputs)`, independent of growth). `f(g) = computeOwnCost({...inputs, priceGrowth: g}).ownCost - target`, decreasing in g. Return `null` if `f(-0.10) <= 0` or `f(0.20) > 0`; else bisect 60 iterations and return the midpoint. `minYearsToBreakEven`: loop years 1..10, return first with `ownCost <= startRent * rentFactor`. `breakEvenMatrix`: nested map over `computeOwnCost({...inputs, years, priceGrowth}).breakEvenRent`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/model`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model
git commit -m "Add inverse calculations and break-even matrix"
```

---

### Task 4: Formatting and i18n

**Files:**
- Create: `src/format.ts`, `src/i18n/nb.ts`
- Test: `src/format.test.ts`

**Interfaces:**
- Produces:

```ts
// src/format.ts
export function formatKr(n: number): string        // 52216.4 -> "52 216 kr"
export function formatPct(n: number, decimals = 2): string   // 0.0236 -> "2,36 %"
export function formatInt(n: number): string       // 1234567 -> "1 234 567"
// src/i18n/nb.ts
export const t = { title: 'Leie eller kjøpe?', ... } as const
```

`t` keys needed by later tasks (add the Norwegian copy): `title`, `ownershipSelveier`, `ownershipBorettslag`, group headings `groupHome`, `groupOneOff`, `groupRunning`, `groupRent`, one label per `Inputs` field plus `startRent` (`labelPrice` ... `labelStartRent`), `taxGainLabel`, `liquidityTitle`, `liquidityPayment`, `liquidityCash`, `matrixTitle`, `matrixYearsAxis`, `matrixGrowthAxis`, `oneYearWarning`, `oneYearWarningAction`, `breakdownTitle`, segment labels `segInterest`, `segBuy`, `segSell`, `segRunning`, `segOpportunity`, `segGain`, `breakdownTotal`, `growthTitle`, `growthSentence(rent: string, growth: string, years: number): string`, `growthUnreachable(years: number): string`, `caveatsTitle`, `caveats: string[]` (the five bullets from the spec, in Norwegian).

- [ ] **Step 1: Write the failing tests**

```ts
// src/format.test.ts
test('formatKr uses space separator and kr', () => expect(formatKr(52216.4)).toBe('52 216 kr'))
test('formatPct uses comma', () => expect(formatPct(0.0236)).toBe('2,36 %'))
test('formatInt', () => expect(formatInt(1234567)).toBe('1 234 567'))
```

Note: `Intl` with `nb-NO` emits a narrow no-break space (U+202F) or no-break space (U+00A0). Normalise all ` ` and ` ` to a regular space in `format.ts` so the tests above are literal.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/format`
Expected: FAIL.

- [ ] **Step 3: Implement `format.ts` and write `nb.ts` with all keys above**

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/format`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/format.ts src/format.test.ts src/i18n
git commit -m "Add number formatting and Norwegian copy"
```

---

### Task 5: Validation and URL state

**Files:**
- Create: `src/model/validate.ts`, `src/state/types.ts`, `src/state/urlState.ts`
- Test: `src/model/validate.test.ts`, `src/state/urlState.test.ts`

**Interfaces:**
- Consumes: `Inputs`, `DEFAULT_INPUTS`, `DEFAULT_START_RENT`.
- Produces:

```ts
// src/model/validate.ts
export const LIMITS: Record<keyof Omit<Inputs, 'ownershipType' | 'taxGain'>, { min: number; max: number; step: number }>
export function clampInputs(inputs: Inputs): Inputs     // also enforces equity <= price, years integer
// src/state/types.ts
export interface AppState { inputs: Inputs; startRent: number }
export const DEFAULT_STATE: AppState
// src/state/urlState.ts
export const PERCENT_KEYS: ReadonlyArray<keyof Inputs>  // rate, taxRate, priceGrowth, inflation, altReturn, docFeeRate, sellCostRate, maintenanceRate, rentGrowth
export function serialize(state: AppState): URLSearchParams   // only non-default fields
export function parse(params: URLSearchParams): AppState       // defaults applied, junk ignored, values clamped
```

LIMITS (min, max, step): price 0..50e6 step 100000; equity 0..50e6 step 100000; rate 0..0.20 step 0.0025; loanYears 1..40 step 1; taxRate 0..1 step 0.01; years 1..10 step 1; priceGrowth −0.10..0.20 step 0.005; inflation 0..0.20 step 0.005; altReturn 0..0.20 step 0.005; docFeeRate 0..0.10 step 0.005; registrationFee 0..100000 step 100; bankFee 0..100000 step 500; sellCostRate 0..0.10 step 0.005; maintenanceRate 0..0.05 step 0.0025; insurance 0..200000 step 1000; municipalFees 0..200000 step 1000; propertyTax 0..200000 step 1000; commonCosts 0..500000 step 1000; rentGrowth 0..0.20 step 0.005. `startRent` limits: 0..300000 step 500 (kept in `urlState.ts` as `START_RENT_LIMITS`).

URL keys: field names as-is, except `ownershipType` → `type`, `taxGain` → `taxGain=1`. Percent keys written as `value * 100` rounded to 2 decimals.

- [ ] **Step 1: Write the failing tests**

```ts
// src/model/validate.test.ts
test('clamps years to 1..10 and rounds to integer', () => {
  expect(clampInputs({ ...d, years: 14.6 }).years).toBe(10)
  expect(clampInputs({ ...d, years: 2.4 }).years).toBe(2)
})
test('equity cannot exceed price', () => {
  expect(clampInputs({ ...d, price: 5e6, equity: 6e6 }).equity).toBe(5e6)
})
// src/state/urlState.test.ts
test('defaults serialize to empty query', () => expect(serialize(DEFAULT_STATE).toString()).toBe(''))
test('non-default fields serialize as percent / amounts', () => {
  const s = { inputs: { ...d, price: 7500000, rate: 0.055, ownershipType: 'borettslag', taxGain: true }, startRent: 30000 }
  expect(serialize(s).toString()).toBe('type=borettslag&price=7500000&rate=5.5&taxGain=1&startRent=30000')
})
test('round trip', () => {
  const s = { inputs: { ...d, years: 5, priceGrowth: 0.025, commonCosts: 48000 }, startRent: 40000 }
  expect(parse(serialize(s))).toEqual(s)
})
test('junk is ignored and values clamped', () => {
  const p = parse(new URLSearchParams('years=abc&price=-5&foo=1&rate=99&type=villa'))
  expect(p.inputs.years).toBe(d.years); expect(p.inputs.price).toBe(0)
  expect(p.inputs.rate).toBe(0.20); expect(p.inputs.ownershipType).toBe('selveier')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/model/validate src/state`
Expected: FAIL.

- [ ] **Step 3: Implement `validate.ts`, `state/types.ts`, `urlState.ts`**

Serialize iterates `Object.keys(DEFAULT_INPUTS)` in declaration order (declare `DEFAULT_INPUTS` in the spec table's order, `ownershipType` first), then `startRent`, so output order matches the test above.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/validate.ts src/model/validate.test.ts src/state
git commit -m "Add input validation and URL state serialization"
```

---

### Task 6: State reducer and hook

**Files:**
- Create: `src/state/reducer.ts`, `src/state/useAppState.ts`
- Test: `src/state/reducer.test.ts`, `src/state/useAppState.test.tsx`

**Interfaces:**
- Consumes: `AppState`, `DEFAULT_STATE`, `clampInputs`, `serialize`, `parse`.
- Produces:

```ts
// src/state/reducer.ts
export type Action =
  | { type: 'patch'; patch: Partial<Inputs> }
  | { type: 'setStartRent'; value: number }
  | { type: 'selectCell'; years: number; priceGrowth: number }
export function reduce(state: AppState, action: Action): AppState
// src/state/useAppState.ts
export function useAppState(): { state: AppState; dispatch: (a: Action) => void }
```

Reducer rules: every `patch` result passes through `clampInputs`; switching `ownershipType` to `selveier` sets `commonCosts` to 0; `setStartRent` clamps with `START_RENT_LIMITS`; `selectCell` is a `patch` of `years` and `priceGrowth`. The hook: `useReducer(reduce, undefined, () => parse(new URLSearchParams(window.location.search)))`, and a `useEffect` on `state` that calls `history.replaceState(null, '', '?' + serialize(state))` (or the bare path when the query is empty).

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/reducer.test.ts
test('patch clamps', () => expect(reduce(DEFAULT_STATE, { type: 'patch', patch: { years: 99 } }).inputs.years).toBe(10))
test('switching to selveier clears commonCosts', () => {
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { ownershipType: 'borettslag', commonCosts: 48000 } })
  expect(reduce(s, { type: 'patch', patch: { ownershipType: 'selveier' } }).inputs.commonCosts).toBe(0)
})
test('selectCell sets years and growth', () => {
  const s = reduce(DEFAULT_STATE, { type: 'selectCell', years: 5, priceGrowth: 0.035 })
  expect(s.inputs.years).toBe(5); expect(s.inputs.priceGrowth).toBe(0.035)
})
// src/state/useAppState.test.tsx  (renderHook from @testing-library/react)
test('reads initial state from URL and writes changes back', () => {
  window.history.replaceState(null, '', '/?years=5')
  const { result } = renderHook(() => useAppState())
  expect(result.current.state.inputs.years).toBe(5)
  act(() => result.current.dispatch({ type: 'setStartRent', value: 40000 }))
  expect(window.location.search).toBe('?years=5&startRent=40000')
})
```

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/state` — Expected: FAIL.

- [ ] **Step 3: Implement `reducer.ts` and `useAppState.ts`**

- [ ] **Step 4: Run tests to verify they pass** — Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "Add app state reducer and URL-synced hook"
```

---

### Task 7: InputPanel component

**Files:**
- Create: `src/components/InputPanel.tsx`, `src/components/NumberField.tsx`, `src/components/InputPanel.css`
- Test: `src/components/InputPanel.test.tsx`

**Interfaces:**
- Consumes: `t`, `LIMITS`, `START_RENT_LIMITS`, `PERCENT_KEYS`, `formatKr`, `OwnCostResult`.
- Produces:

```tsx
export interface InputPanelProps { state: AppState; result: OwnCostResult; dispatch: (a: Action) => void }
export function InputPanel(props: InputPanelProps): JSX.Element
// NumberField: label, value (display units), min/max/step (display units), unit ('kr' | '%' | 'år'), onChange(valueInDisplayUnits), slider?: boolean
```

Layout: segmented toggle (two `<button role="radio">` inside `role="radiogroup"`), then four `<fieldset>` groups with `<legend>` from `t.group*`. Fields in order per group: Bolig og lån: price*, equity*, rate*, loanYears, taxRate, years*; Engangskostnader: docFeeRate (hidden for borettslag), registrationFee, bankFee, sellCostRate; Drift: maintenanceRate, insurance, municipalFees, propertyTax, commonCosts (only for borettslag), inflation, taxGain checkbox; Leiescenario: startRent*, rentGrowth, altReturn. `*` = also renders a slider. Percent fields convert decimal ↔ percent at the `NumberField` boundary; display value is `Number((value * 100).toFixed(4))` so 0.06 shows as `6`, and input goes back as `parsed / 100`. Liquidity box at the bottom: `t.liquidityPayment` → `formatKr(result.pmt)`, `t.liquidityCash` → `formatKr(result.cashNeeded)`.

- [ ] **Step 1: Write the failing tests**

```tsx
test('borettslag hides dokumentavgift and shows felleskostnader', async () => {
  const dispatch = vi.fn()
  const { rerender } = render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  expect(screen.getByLabelText(t.labelDocFeeRate)).toBeInTheDocument()
  expect(screen.queryByLabelText(t.labelCommonCosts)).toBeNull()
  await userEvent.click(screen.getByRole('radio', { name: t.ownershipBorettslag }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { ownershipType: 'borettslag' } })
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { ownershipType: 'borettslag' } })
  rerender(<InputPanel state={s} result={computeOwnCost(s.inputs)} dispatch={dispatch} />)
  expect(screen.queryByLabelText(t.labelDocFeeRate)).toBeNull()
  expect(screen.getByLabelText(t.labelCommonCosts)).toBeInTheDocument()
})
test('percent field dispatches decimal', async () => {
  const dispatch = vi.fn()
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={dispatch} />)
  const rate = screen.getByLabelText(t.labelRate) as HTMLInputElement
  expect(rate.value).toBe('6')
  fireEvent.change(rate, { target: { value: '5.5' } })
  expect(dispatch).toHaveBeenCalledWith({ type: 'patch', patch: { rate: 0.055 } })
})
test('liquidity box shows payment and cash needed', () => {
  render(<InputPanel state={DEFAULT_STATE} result={computeOwnCost(d)} dispatch={() => {}} />)
  expect(screen.getByText('41 256 kr')).toBeInTheDocument()
  expect(screen.getByText('2 231 090 kr')).toBeInTheDocument()
})
```

`getByLabelText` must resolve to the number input, not the slider: give the slider `aria-label={label + ' (slider)'}`.

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/components/InputPanel` — Expected: FAIL.

- [ ] **Step 3: Implement `NumberField` and `InputPanel`**

- [ ] **Step 4: Run tests to verify they pass** — Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "Add input panel"
```

---

### Task 8: Matrix component

**Files:**
- Create: `src/components/Matrix.tsx`, `src/components/matrixColor.ts`, `src/components/Matrix.css`
- Test: `src/components/matrixColor.test.ts`, `src/components/Matrix.test.tsx`

**Interfaces:**
- Consumes: `breakEvenMatrix`, `MATRIX_YEARS`, `MATRIX_GROWTHS`, `formatKr`, `formatPct`, `t`.
- Produces:

```ts
// matrixColor.ts
export function cellTone(breakEven: number, startRent: number): { kind: 'buy' | 'rent'; intensity: number }
// intensity 0..1 = min(1, |breakEven - startRent| / (0.5 * startRent)); startRent <= 0 => { kind: 'rent', intensity: 1 }
export function cellStyle(tone: ReturnType<typeof cellTone>): React.CSSProperties   // background: green/red with alpha = 0.15 + 0.6 * intensity
// Matrix.tsx
export interface MatrixProps { state: AppState; dispatch: (a: Action) => void }
export function Matrix(props: MatrixProps): JSX.Element
```

Rendering: `<table>` with `<th scope="col">` growth headers (`formatPct(g, 1)`) and `<th scope="row">` year headers (`"{n} år"`). Each cell is a `<button>` with text `formatInt(Math.round(value))`, `aria-pressed` true for the selected cell (`inputs.years`, `inputs.priceGrowth` within 1e-9), `aria-label` = `"{years} år, {growth}: {kr}"`, onClick → `dispatch({ type: 'selectCell', years, priceGrowth })`. When `inputs.years === 1` render `<div role="alert">{t.oneYearWarning}</div>` with a button `t.oneYearWarningAction` dispatching `{ type: 'patch', patch: { taxGain: true } }`, hidden when `taxGain` is already true.

- [ ] **Step 1: Write the failing tests**

```ts
// matrixColor.test.ts
test('below rent is buy, intensity scales', () => {
  expect(cellTone(30000, 35000)).toEqual({ kind: 'buy', intensity: expect.closeTo(5000 / 17500, 5) })
  expect(cellTone(70000, 35000)).toEqual({ kind: 'rent', intensity: 1 })
})
test('zero rent gives full red without NaN', () => {
  expect(cellTone(30000, 0)).toEqual({ kind: 'rent', intensity: 1 })
})
// Matrix.test.tsx
test('renders 10 x 11 cells and marks the selected one', () => {
  render(<Matrix state={DEFAULT_STATE} dispatch={() => {}} />)
  const cells = screen.getAllByRole('button', { pressed: false }).length + screen.getAllByRole('button', { pressed: true }).length
  expect(cells).toBe(110)
  expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('52 216')
})
test('clicking a cell dispatches selectCell', async () => {
  const dispatch = vi.fn()
  render(<Matrix state={DEFAULT_STATE} dispatch={dispatch} />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'selectCell', years: 5, priceGrowth: 0.035 })
})
test('shows one-year warning', () => {
  const s = reduce(DEFAULT_STATE, { type: 'patch', patch: { years: 1 } })
  render(<Matrix state={s} dispatch={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent(t.oneYearWarning)
})
```

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/components/matrix src/components/Matrix` — Expected: FAIL.

- [ ] **Step 3: Implement `matrixColor.ts` and `Matrix.tsx`; CSS gives the wrapper `overflow-x: auto`**

- [ ] **Step 4: Run tests to verify they pass** — Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "Add break-even matrix"
```

---

### Task 9: Breakdown component

**Files:**
- Create: `src/components/Breakdown.tsx`, `src/components/breakdownData.ts`
- Test: `src/components/breakdownData.test.ts`, `src/components/Breakdown.test.tsx`

**Interfaces:**
- Consumes: `OwnCostResult`, `formatKr`, `t`, Recharts `BarChart`.
- Produces:

```ts
// breakdownData.ts
export interface Segment { key: 'interest' | 'buy' | 'sell' | 'running' | 'opportunity' | 'gain'; label: string; value: number }
export function breakdownSegments(r: OwnCostResult): Segment[]   // gain value = -r.gain (negative when there is a gain)
// Breakdown.tsx
export interface BreakdownProps { result: OwnCostResult; years: number; priceGrowth: number }
export function Breakdown(props: BreakdownProps): JSX.Element
```

Rendering: heading `t.breakdownTitle` plus `"{years} år, {formatPct(priceGrowth,1)}"`; a Recharts `BarChart` (fixed `width={320} height={360}`, no ResponsiveContainer, so jsdom renders it) with one data row and six `<Bar stackId="a">` using segment keys; next to it a `<table>` with a row per segment (`label`, `formatKr(value)`) and a final row `t.breakdownTotal` → `formatKr(r.ownCost)`.

- [ ] **Step 1: Write the failing tests**

```ts
// breakdownData.test.ts
test('segments sum to ownCost', () => {
  const r = computeOwnCost({ ...d, years: 5, priceGrowth: 0.035 })
  const segs = breakdownSegments(r)
  expect(segs.map(s => s.key)).toEqual(['interest', 'buy', 'sell', 'running', 'opportunity', 'gain'])
  expect(Math.abs(segs.reduce((a, s) => a + s.value, 0) - r.ownCost)).toBeLessThan(1)
  expect(segs[5].value).toBeLessThan(0)
})
// Breakdown.test.tsx
test('table shows segments and total', () => {
  const r = computeOwnCost({ ...d, years: 3 })
  render(<Breakdown result={r} years={3} priceGrowth={0} />)
  expect(screen.getByText(t.segInterest).nextSibling).toHaveTextContent('938 597 kr')
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 936 750 kr')
})
```

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/components/breakdown src/components/Breakdown` — Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests to verify they pass** — Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "Add ownCost breakdown chart and table"
```

---

### Task 10: GrowthCurve component

**Files:**
- Create: `src/components/GrowthCurve.tsx`, `src/components/growthData.ts`
- Test: `src/components/growthData.test.ts`, `src/components/GrowthCurve.test.tsx`

**Interfaces:**
- Consumes: `requiredGrowth`, `MATRIX_YEARS`, `formatKr`, `formatPct`, `t`, Recharts `LineChart`.
- Produces:

```ts
// growthData.ts
export interface GrowthPoint { years: number; growth: number | null }
export function growthSeries(inputs: Inputs, startRent: number): GrowthPoint[]   // one point per MATRIX_YEARS
// GrowthCurve.tsx
export interface GrowthCurveProps { state: AppState }
export function GrowthCurve(props: GrowthCurveProps): JSX.Element
```

Rendering: heading `t.growthTitle`; a `<p data-testid="growth-sentence">` with `t.growthSentence(formatKr(startRent), formatPct(g), inputs.years)` when `g` for the selected year is a number, else `t.growthUnreachable(inputs.years)`; a `LineChart` (`width={560} height={280}`), `<Line dataKey="growth" connectNulls={false}>` so nulls leave gaps, y axis formatted with `formatPct(v, 1)`.

- [ ] **Step 1: Write the failing tests**

```ts
// growthData.test.ts
test('series has 10 points and matches reference at 3 and 10 years', () => {
  const s = growthSeries(d, 35000)
  expect(s).toHaveLength(10)
  expect(s[2].growth).toBeCloseTo(0.0236, 4); expect(s[9].growth).toBeCloseTo(0.0079, 4)
})
test('unreachable years are null', () => {
  expect(growthSeries(d, 1000).every(p => p.growth === null)).toBe(true)
})
// GrowthCurve.test.tsx
test('sentence for reachable growth', () => {
  render(<GrowthCurve state={DEFAULT_STATE} />)
  expect(screen.getByTestId('growth-sentence')).toHaveTextContent(t.growthSentence('35 000 kr', '2,36 %', 3))
})
test('sentence for unreachable growth', () => {
  render(<GrowthCurve state={{ ...DEFAULT_STATE, startRent: 1000 }} />)
  expect(screen.getByTestId('growth-sentence')).toHaveTextContent(t.growthUnreachable(3))
})
```

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/components/growth src/components/GrowthCurve` — Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests to verify they pass** — Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "Add required-growth curve"
```

---

### Task 11: App layout, caveats and responsive CSS

**Files:**
- Create: `src/components/Caveats.tsx`
- Modify: `src/App.tsx`, `src/index.css`, `src/App.test.tsx`

**Interfaces:**
- Consumes: everything above. `App` calls `useAppState()`, computes `result = computeOwnCost(state.inputs)` once with `useMemo`, and renders `<InputPanel>`, `<Matrix>`, `<Breakdown>`, `<GrowthCurve>`, `<Caveats>`.
- Produces: `Caveats(): JSX.Element` renders `<details><summary>{t.caveatsTitle}</summary><ul>` with one `<li>` per `t.caveats`.

CSS: `.layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }`, `@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }`. Body gets a system font stack, 16 px side padding on mobile. Light theme only.

- [ ] **Step 1: Extend `src/App.test.tsx`**

```tsx
test('changing startRent recolours the selected cell', () => {
  window.history.replaceState(null, '', '/')
  render(<App />)
  const cell = () => screen.getByRole('button', { pressed: true })          // 3 år, 0 %: 52 216
  expect(cell().getAttribute('data-kind')).toBe('rent')
  fireEvent.change(screen.getByLabelText(t.labelStartRent), { target: { value: '60000' } })
  expect(cell().getAttribute('data-kind')).toBe('buy')
})
test('clicking a cell updates the breakdown', async () => {
  window.history.replaceState(null, '', '/')
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /^5 år, 3,5 %/ }))
  expect(screen.getByText(t.breakdownTotal).nextSibling).toHaveTextContent('1 305 538 kr')
})
test('caveats are listed', () => {
  render(<App />)
  expect(screen.getAllByRole('listitem').filter(li => t.caveats.includes(li.textContent ?? ''))).toHaveLength(t.caveats.length)
})
```

Matrix cells get `data-kind={tone.kind}` (add in `Matrix.tsx` if missing).

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- src/App` — Expected: FAIL.

- [ ] **Step 3: Implement `Caveats.tsx`, wire `App.tsx`, write `index.css`**

- [ ] **Step 4: Run all tests and build** — Run: `npm test && npm run build` — Expected: all PASS, build succeeds.

- [ ] **Step 5: Manual check in the browser**

Run `npm run dev`, open the app, check: panel left and views right at desktop width; at 800 px the panel stacks above and the matrix scrolls horizontally; the URL updates when sliding price; reloading keeps the scenario.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Assemble app layout with caveats and responsive CSS"
```

---

### Task 12: README, GitHub repo and Pages deploy

**Files:**
- Create: `README.md`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm test`, `npm run build`.

- [ ] **Step 1: Write `README.md`**

Sections: Formål (two sentences), Kjør lokalt (`npm install`, `npm run dev`, `npm test`), Modellen (the "Beregning" block and the input table copied from the spec), Referansetall (the matrix and partials from the spec), Forbehold (the five bullets), Lenke til appen (`https://frednors.github.io/bolig/`, filled in once Pages is live).

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

Trigger `push` to `main` and `workflow_dispatch`. Permissions `contents: read`, `pages: write`, `id-token: write`. Job `build`: `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 22` and `cache: npm`, `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` with `path: dist`. Job `deploy` (needs build, environment `github-pages`): `actions/deploy-pages@v4`.

- [ ] **Step 3: Commit**

```bash
git add README.md .github
git commit -m "Add README and GitHub Pages deploy workflow"
```

- [ ] **Step 4: Ask the user to confirm creating the public repo `FredNors/bolig`, then create and push**

```bash
gh auth switch --user FredNors
git branch -M main
gh repo create FredNors/bolig --public --source=. --remote=origin --push
gh api -X POST repos/FredNors/bolig/pages -f build_type=workflow
```

- [ ] **Step 5: Verify the deploy**

Run: `gh run watch` then open `https://frednors.github.io/bolig/`. Expected: workflow green, app loads, `?years=5&priceGrowth=3.5` opens with that cell selected. Fill the link into `README.md`, commit and push.
