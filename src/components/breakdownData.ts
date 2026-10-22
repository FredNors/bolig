import { t } from '../i18n/nb'
import type { OwnCostResult } from '../model/types'

export type SegmentKey = 'interest' | 'buy' | 'sell' | 'running' | 'opportunity' | 'gain'

export interface Segment {
  key: SegmentKey
  label: string
  value: number
}

/** Cost segments that sum to ownCost. The gain segment is negative when the home gained value. */
export function breakdownSegments(r: OwnCostResult): Segment[] {
  return [
    { key: 'interest', label: t.segInterest, value: r.netInterest },
    { key: 'buy', label: t.segBuy, value: r.buyCosts },
    { key: 'sell', label: t.segSell, value: r.sellCosts },
    { key: 'running', label: t.segRunning, value: r.running },
    { key: 'opportunity', label: t.segOpportunity, value: r.opportunity },
    { key: 'gain', label: t.segGain, value: -r.gain },
  ]
}
