import { useMemo, useState } from 'react'
import { formatCompact, formatNok, formatPct } from '../format'
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
  const [hover, setHover] = useState<{ yi: number; gi: number } | null>(null)

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
            <tr className="axis-row">
              <td aria-hidden="true" />
              <th scope="colgroup" colSpan={MATRIX_GROWTHS.length} className="axis-title">
                {t.matrixGrowthAxis}
              </th>
            </tr>
            <tr>
              <th scope="col" className="corner">
                {t.matrixYearsAxis}
              </th>
              {MATRIX_GROWTHS.map((g) => (
                <th key={g} scope="col" className={g === 0 ? 'zero' : undefined}>
                  {formatPct(g, 0)}
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
                  const verdict = tone.kind === 'buy' ? t.cellBuy : t.cellRent
                  const selected = inputs.years === years && Math.abs(inputs.priceGrowth - growth) < EPS
                  const hovered = hover?.yi === yi && hover?.gi === gi
                  return (
                    <td key={growth} className={[gi >= 7 ? 'tip-left' : '', growth === 0 ? 'zero' : ''].join(' ').trim() || undefined}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${years} år, ${formatPct(growth, 1)}: ${formatNok(value)}, ${verdict}`}
                        data-kind={tone.kind}
                        style={cellStyle(tone)}
                        onClick={() => dispatch({ type: 'selectCell', years, priceGrowth: growth })}
                        onMouseEnter={() => setHover({ yi, gi })}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover({ yi, gi })}
                        onBlur={() => setHover(null)}
                      >
                        <span className="marker" aria-hidden="true">
                          {tone.kind === 'buy' ? '▼' : '▲'}
                        </span>
                        {formatCompact(value)}
                      </button>
                      {hovered && (
                        <div role="tooltip" className="cell-tip">
                          <strong>{formatNok(value)}</strong> · {verdict}
                          <span className="cell-tip-sub">
                            {years} år, {formatPct(growth, 1)} prisvekst
                          </span>
                        </div>
                      )}
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
