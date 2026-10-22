const nb = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })

/** Intl emits no-break and narrow no-break spaces; normalise to plain spaces. */
const plain = (s: string) => s.replace(/[  ]/g, ' ')

export function formatInt(n: number): string {
  return plain(nb.format(Math.round(n)))
}

export function formatKr(n: number): string {
  return `${formatInt(n)} kr`
}

export function formatPct(n: number, decimals = 2): string {
  const f = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${plain(f.format(n * 100))} %`
}
