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

type Rgb = [number, number, number]
const RAMP: Record<CellKind, [Rgb, Rgb]> = {
  buy: [[232, 245, 236], [21, 128, 61]],
  rent: [[254, 226, 226], [220, 38, 38]],
}

const mix = (a: Rgb, b: Rgb, f: number): string =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(', ')})`

/** Pale at low intensity, saturated at high; text flips to white once the fill is dark. */
export function cellStyle(tone: CellTone): CSSProperties {
  const [pale, strong] = RAMP[tone.kind]
  return {
    background: mix(pale, strong, tone.intensity),
    color: tone.intensity > 0.6 ? '#fff' : 'var(--text)',
  }
}
