import { formatKr } from '../format'
import { t } from '../i18n/nb'
import type { Inputs, OwnCostResult, OwnershipType } from '../model/types'
import { LIMITS, type NumericKey } from '../model/validate'
import type { Action } from '../state/reducer'
import type { AppState } from '../state/types'
import { PERCENT_KEYS, START_RENT_LIMITS } from '../state/urlState'
import { NumberField, type Unit } from './NumberField'
import './InputPanel.css'

export interface InputPanelProps {
  state: AppState
  result: OwnCostResult
  dispatch: (a: Action) => void
}

const percentSet = new Set<keyof Inputs>(PERCENT_KEYS)
const yearKeys = new Set<NumericKey>(['years', 'loanYears'])

const LABELS: Record<NumericKey, string> = {
  price: t.labelPrice,
  equity: t.labelEquity,
  rate: t.labelRate,
  loanYears: t.labelLoanYears,
  taxRate: t.labelTaxRate,
  years: t.labelYears,
  priceGrowth: t.labelPriceGrowth,
  inflation: t.labelInflation,
  altReturn: t.labelAltReturn,
  docFeeRate: t.labelDocFeeRate,
  registrationFee: t.labelRegistrationFee,
  bankFee: t.labelBankFee,
  sellCostRate: t.labelSellCostRate,
  maintenanceRate: t.labelMaintenanceRate,
  insurance: t.labelInsurance,
  municipalFees: t.labelMunicipalFees,
  propertyTax: t.labelPropertyTax,
  commonCosts: t.labelCommonCosts,
  rentGrowth: t.labelRentGrowth,
}

const toDisplay = (v: number) => Number((v * 100).toFixed(4))

export function InputPanel({ state, result, dispatch }: InputPanelProps) {
  const { inputs, startRent } = state
  const isBorettslag = inputs.ownershipType === 'borettslag'

  const field = (key: NumericKey, slider = false) => {
    const limit = LIMITS[key]
    const isPct = percentSet.has(key)
    const unit: Unit = isPct ? '%' : yearKeys.has(key) ? 'år' : 'kr'
    const scale = isPct ? toDisplay : (v: number) => v
    return (
      <NumberField
        key={key}
        label={LABELS[key]}
        value={scale(inputs[key])}
        min={scale(limit.min)}
        max={scale(limit.max)}
        step={scale(limit.step)}
        unit={unit}
        slider={slider}
        onChange={(v) => dispatch({ type: 'patch', patch: { [key]: isPct ? v / 100 : v } })}
      />
    )
  }

  const setType = (ownershipType: OwnershipType) => dispatch({ type: 'patch', patch: { ownershipType } })

  return (
    <aside className="input-panel">
      <div className="segmented" role="radiogroup" aria-label={t.ownershipLabel}>
        {(['selveier', 'borettslag'] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={inputs.ownershipType === type}
            onClick={() => setType(type)}
          >
            {type === 'selveier' ? t.ownershipSelveier : t.ownershipBorettslag}
          </button>
        ))}
      </div>

      <fieldset>
        <legend>{t.groupHome}</legend>
        {field('price', true)}
        {field('equity', true)}
        {inputs.equity > inputs.price && <p className="field-hint">{t.equityCapped}</p>}
        {field('rate', true)}
        {field('loanYears')}
        {field('taxRate')}
        {field('years', true)}
      </fieldset>

      <fieldset>
        <legend>{t.groupOneOff}</legend>
        {!isBorettslag && field('docFeeRate')}
        {field('registrationFee')}
        {field('bankFee')}
        {field('sellCostRate')}
      </fieldset>

      <fieldset>
        <legend>{t.groupRunning}</legend>
        {field('maintenanceRate')}
        {field('insurance')}
        {field('municipalFees')}
        {field('propertyTax')}
        {isBorettslag && field('commonCosts')}
        {field('inflation')}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={inputs.taxGain}
            onChange={(e) => dispatch({ type: 'patch', patch: { taxGain: e.target.checked } })}
          />
          {t.taxGainLabel}
        </label>
      </fieldset>

      <fieldset>
        <legend>{t.groupRent}</legend>
        <NumberField
          label={t.labelStartRent}
          value={startRent}
          min={START_RENT_LIMITS.min}
          max={START_RENT_LIMITS.max}
          step={START_RENT_LIMITS.step}
          unit="kr"
          slider
          onChange={(value) => dispatch({ type: 'setStartRent', value })}
        />
        {field('rentGrowth')}
        {field('altReturn')}
      </fieldset>

      <section className="liquidity">
        <h2>{t.liquidityTitle}</h2>
        <dl>
          <dt>{t.liquidityPayment}</dt>
          <dd>{formatKr(result.pmt)}</dd>
          <dt>{t.liquidityCash}</dt>
          <dd>{formatKr(result.cashNeeded)}</dd>
        </dl>
      </section>
    </aside>
  )
}
