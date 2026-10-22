const nb = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })

/** Intl emits no-break and narrow no-break spaces; normalise to plain spaces. */
const plain = (s: string) => s.replace(/[  ]/g, ' ')

export function formatInt(n: number): string {
  return plain(nb.format(Math.round(n) + 0)) // + 0 turns -0 into 0
}

export function formatNok(n: number): string {
  return `${formatInt(n)} NOK`
}

export function formatPct(n: number, decimals = 2): string {
  const f = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${plain(f.format(n * 100))} %`
}

/** Whole thousands with a k suffix, for dense cells: 52216 -> "52k". */
export function formatCompact(n: number): string {
  return `${formatInt(Math.round(n / 1000))}k`
}
