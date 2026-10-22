import { useEffect, useRef } from 'react'
import { t } from '../i18n/nb'
import './AssumptionsDialog.css'

export interface AssumptionsDialogProps {
  open: boolean
  onClose: () => void
}

/** Modal dialog with the model summary and the caveats. Body scrolls inside the dialog. */
export function AssumptionsDialog({ open, onClose }: AssumptionsDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="assumptions-title">
        <div className="modal-head">
          <h2 id="assumptions-title">{t.assumptionsTitle}</h2>
          <button ref={closeRef} type="button" className="icon-button" aria-label={t.close} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <h3>{t.howTitle}</h3>
          <p>{t.howIntro}</p>
          <ul>
            {t.howItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>{t.caveatsTitle}</h3>
          <ul>
            {t.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
