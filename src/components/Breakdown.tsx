import { Bar, BarChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { formatInt, formatNok, formatPct } from '../format'
import { t } from '../i18n/nb'
import type { OwnCostResult } from '../model/types'
import { breakdownSegments } from './breakdownData'
import { CHART_GRID, CHART_TEXT, SERIES } from './chartColors'
import './Breakdown.css'

export interface BreakdownProps {
  result: OwnCostResult
  years: number
  priceGrowth: number
}

export function Breakdown({ result, years, priceGrowth }: BreakdownProps) {
  const segments = breakdownSegments(result)
  const row: Record<string, number | string> = { name: `${years} år` }
  for (const s of segments) row[s.key] = Math.round(s.value)
  const labelOf = Object.fromEntries(segments.map((s) => [s.key, s.label]))
  const cellKey = `${years}-${priceGrowth}`

  return (
    <section className="breakdown">
      <h2 key={cellKey} className="breakdown-cell flash">
        {years} år, {formatPct(priceGrowth, 1)} <span className="muted">prisvekst</span>
      </h2>
      <div className="breakdown-hero" data-testid="breakdown-hero">
        <span className="hint">{t.breakdownHero}</span>
        <strong>{formatNok(result.ownCost)}</strong>
      </div>
      <BarChart
        width={220}
        height={240}
        data={[row]}
        stackOffset="sign"
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        className="breakdown-chart"
      >
        <XAxis dataKey="name" tick={{ fill: CHART_TEXT, fontSize: 12 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
        <YAxis
          tick={{ fill: CHART_TEXT, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) => formatInt(v / 1000) + 'k'}
        />
        <ReferenceLine y={0} stroke={CHART_TEXT} />
        <Tooltip
          formatter={(value, name) => [formatNok(Number(value)), labelOf[String(name)] ?? String(name)]}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        {segments.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} stackId="a" fill={SERIES[i]} stroke="#fff" strokeWidth={2} isAnimationActive={false} />
        ))}
      </BarChart>
      <table className="breakdown-table">
        <tbody>
          {segments.map((s, i) => (
            <tr key={s.key}>
              <td>
                <span className="swatch" style={{ background: SERIES[i] }} aria-hidden="true" />
                {s.label}
              </td>
              <td className="num">{formatNok(s.value)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>{t.breakdownTotal}</td>
            <td className="num">{formatNok(result.ownCost)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
