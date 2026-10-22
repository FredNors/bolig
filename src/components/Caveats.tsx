import { t } from '../i18n/nb'

export function Caveats() {
  return (
    <details className="caveats">
      <summary>{t.caveatsTitle}</summary>
      <ul>
        {t.caveats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </details>
  )
}
