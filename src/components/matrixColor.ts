import type { CSSProperties } from 'react'

export type CellKind = 'buy' | 'rent'

export interface CellTone {
  kind: CellKind
  intensity: number
}

/** 'buy' when the break-even rent is below the actual rent (buying is cheaper). Intensity saturates at ±50 %. */
export function cellTone(breakEven: number, startRent: number): CellTone {
  if (!(startRent > 0)) return { kind: 'rent', intensity: 1 }
  const kind: CellKind = breakEven < startRent ? 'buy' : 'rent'
  const intensity = Math.min(1, Math.abs(breakEven - startRent) / (0.5 * startRent))
  return { kind, intensity }
}

const GREEN = '22, 163, 74'
const RED = '220, 38, 38'

export function cellStyle(tone: CellTone): CSSProperties {
  const alpha = 0.15 + 0.6 * tone.intensity
  return { background: `rgba(${tone.kind === 'buy' ? GREEN : RED}, ${alpha.toFixed(3)})` }
}
