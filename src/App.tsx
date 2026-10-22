import { useMemo } from 'react'
import { Breakdown } from './components/Breakdown'
import { Caveats } from './components/Caveats'
import { GrowthCurve } from './components/GrowthCurve'
import { InputPanel } from './components/InputPanel'
import { Matrix } from './components/Matrix'
import { t } from './i18n/nb'
import { computeOwnCost } from './model/ownCost'
import { useAppState } from './state/useAppState'

export default function App() {
  const { state, dispatch } = useAppState()
  const result = useMemo(() => computeOwnCost(state.inputs), [state.inputs])

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>
      <div className="layout">
        <InputPanel state={state} result={result} dispatch={dispatch} />
        <main className="views">
          <Matrix state={state} dispatch={dispatch} />
          <Breakdown result={result} years={state.inputs.years} priceGrowth={state.inputs.priceGrowth} />
          <GrowthCurve state={state} />
          <Caveats />
        </main>
      </div>
    </div>
  )
}
