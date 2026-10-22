import { useEffect, useRef, type ReactNode } from 'react'
import { t } from '../i18n/nb'
import './SidePanel.css'

export interface SidePanelProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Non-modal panel anchored to the right edge. Closes on Escape, the close button, or a click outside it. */
export function SidePanel({ open, title, onClose, children }: SidePanelProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current && !ref.current.contains(target) && !(target as Element).closest?.('.matrix')) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <aside ref={ref} className="side-panel" role="dialog" aria-modal="false" aria-label={title}>
      <div className="side-panel-head">
        <span className="side-panel-title">{title}</span>
        <button type="button" className="icon-button" aria-label={t.close} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="side-panel-body">{children}</div>
    </aside>
  )
}
