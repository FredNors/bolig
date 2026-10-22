import { useCallback, useMemo, useState } from 'react'
import { Breakdown } from './components/Breakdown'
import { Caveats } from './components/Caveats'
import { GrowthCurve } from './components/GrowthCurve'
import { InputPanel } from './components/InputPanel'
import { Matrix } from './components/Matrix'
import { SidePanel } from './components/SidePanel'
import { t } from './i18n/nb'
import { computeOwnCost } from './model/ownCost'
import type { Action } from './state/reducer'
import { useAppState } from './state/useAppState'

export default function App() {
  const { state, dispatch } = useAppState()
  const result = useMemo(() => computeOwnCost(state.inputs), [state.inputs])
  const [panelOpen, setPanelOpen] = useState(false)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const dispatchFromMatrix = (a: Action) => {
    dispatch(a)
    if (a.type === 'selectCell') setPanelOpen(true)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>
      <div className="layout">
        <InputPanel state={state} result={result} dispatch={dispatch} />
        <main className="views">
          <Matrix state={state} dispatch={dispatchFromMatrix} />
          <GrowthCurve state={state} />
          <Caveats />
        </main>
      </div>
      <SidePanel open={panelOpen} title={t.breakdownTitle} onClose={closePanel}>
        <Breakdown result={result} years={state.inputs.years} priceGrowth={state.inputs.priceGrowth} />
      </SidePanel>
    </div>
  )
}
