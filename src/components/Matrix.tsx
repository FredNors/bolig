import { useMemo } from 'react'
import { formatInt, formatNok, formatPct } from '../format'
import { t } from '../i18n/nb'
import { breakEvenMatrix, MATRIX_GROWTHS, MATRIX_YEARS } from '../model/matrix'
import type { Action } from '../state/reducer'
import type { AppState } from '../state/types'
import { cellStyle, cellTone } from './matrixColor'
import './Matrix.css'

export interface MatrixProps {
  state: AppState
  dispatch: (a: Action) => void
}

const EPS = 1e-9

export function Matrix({ state, dispatch }: MatrixProps) {
  const { inputs, startRent } = state
  const matrix = useMemo(() => breakEvenMatrix(inputs), [inputs])

  return (
    <section className="matrix card">
      <div className="card-head">
        <h2>{t.matrixTitle}</h2>
        <p className="hint">{t.matrixHint}</p>
      </div>
      {inputs.years === 1 && (
        <div role="alert" className="warning">
          <span>{t.oneYearWarning}</span>
          {!inputs.taxGain && (
            <button type="button" onClick={() => dispatch({ type: 'patch', patch: { taxGain: true } })}>
              {t.oneYearWarningAction}
            </button>
          )}
        </div>
      )}
      <div className="matrix-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col" className="corner">
                {t.matrixYearsAxis} ↓ / {t.matrixGrowthAxis} →
              </th>
              {MATRIX_GROWTHS.map((g) => (
                <th key={g} scope="col">
                  {formatPct(g, 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_YEARS.map((years, yi) => (
              <tr key={years}>
                <th scope="row">{years} år</th>
                {MATRIX_GROWTHS.map((growth, gi) => {
                  const value = matrix[yi][gi]
                  const tone = cellTone(value, startRent)
                  const selected = inputs.years === years && Math.abs(inputs.priceGrowth - growth) < EPS
                  return (
                    <td key={growth}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${years} år, ${formatPct(growth, 1)}: ${formatNok(value)}, ${tone.kind === 'buy' ? t.cellBuy : t.cellRent}`}
                        data-kind={tone.kind}
                        style={cellStyle(tone)}
                        onClick={() => dispatch({ type: 'selectCell', years, priceGrowth: growth })}
                      >
                        <span className="marker" aria-hidden="true">
                          {tone.kind === 'buy' ? '▼' : '▲'}
                        </span>
                        {formatInt(Math.round(value))}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
