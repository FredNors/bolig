import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNok, formatPct } from '../format'
import { t } from '../i18n/nb'
import type { AppState } from '../state/types'
import { CHART_GRID, CHART_TEXT, SERIES } from './chartColors'
import { growthSeries } from './growthData'
import './GrowthCurve.css'

export interface GrowthCurveProps {
  state: AppState
}

export function GrowthCurve({ state }: GrowthCurveProps) {
  const { inputs, startRent } = state
  const series = useMemo(() => growthSeries(inputs, startRent), [inputs, startRent])
  const selected = series.find((p) => p.years === inputs.years)
  const g = selected?.growth ?? null
  const data = series.map((p) => ({ years: p.years, growth: p.growth === null ? null : p.growth * 100 }))

  return (
    <section className="growth">
      <h2>{t.growthTitle}</h2>
      <p data-testid="growth-sentence" className="sentence">
        {g === null ? t.growthUnreachable(inputs.years) : t.growthSentence(formatNok(startRent), formatPct(g), inputs.years)}
      </p>
      <div className="growth-scroll">
        <LineChart width={560} height={280} data={data} margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="years"
            tick={{ fill: CHART_TEXT, fontSize: 12 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
            label={{ value: t.growthAxisYears, position: 'insideBottom', offset: -12, fill: CHART_TEXT, fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: CHART_TEXT, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => formatPct(v / 100, 1)}
          />
          <Tooltip
            formatter={(value) => [formatPct(Number(value) / 100), t.growthAxisGrowth]}
            labelFormatter={(label) => `${label} ${t.unitYears}`}
          />
          <Line
            type="monotone"
            dataKey="growth"
            stroke={SERIES[0]}
            strokeWidth={2}
            dot={{ r: 4, fill: SERIES[0], stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          {g !== null && <ReferenceDot x={inputs.years} y={g * 100} r={7} fill={SERIES[1]} stroke="#fff" strokeWidth={2} />}
        </LineChart>
      </div>
    </section>
  )
}
