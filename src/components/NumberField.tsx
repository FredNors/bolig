import { useId } from 'react'

export type Unit = 'kr' | '%' | 'år'

export interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: Unit
  onChange: (value: number) => void
  slider?: boolean
}

/** A labelled number input (display units) with an optional slider. */
export function NumberField({ label, value, min, max, step, unit, onChange, slider }: NumberFieldProps) {
  const id = useId()
  const handle = (raw: string) => {
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(n)) return
    onChange(n)
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-row">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => handle(e.target.value)}
        />
        <span className="unit">{unit}</span>
      </div>
      {slider && (
        <input
          type="range"
          aria-label={`${label} (slider)`}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => handle(e.target.value)}
        />
      )}
    </div>
  )
}
