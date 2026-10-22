import { useEffect, useId, useState } from 'react'

export type Unit = 'NOK' | '%' | 'år'

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

const parse = (raw: string): number | null => {
  const n = Number(raw)
  return raw.trim() === '' || !Number.isFinite(n) ? null : n
}

/**
 * A labelled number input (display units) with an optional slider.
 * The text input keeps a local draft and commits on blur or Enter, so intermediate
 * keystrokes never reach the model; the slider commits on every change.
 */
export function NumberField({ label, value, min, max, step, unit, onChange, slider }: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const n = parse(draft)
    if (n !== null && n !== value) onChange(n)
    // Reset to the current prop; if the commit changes it, the effect above re-syncs.
    setDraft(String(value))
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-row">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
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
          onChange={(e) => {
            const n = parse(e.target.value)
            if (n !== null) onChange(n)
          }}
        />
      )}
    </div>
  )
}
