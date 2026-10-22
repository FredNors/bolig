import { formatInt, formatNok, formatPct } from './format'

test('formatNok uses space separator and NOK', () => expect(formatNok(52216.4)).toBe('52 216 NOK'))
test('formatNok rounds negatives', () => expect(formatNok(-1689177.2)).toBe('−1 689 177 NOK'))
test('formatPct uses comma', () => expect(formatPct(0.0236)).toBe('2,36 %'))
test('formatPct with one decimal', () => expect(formatPct(0.035, 1)).toBe('3,5 %'))
test('formatInt', () => expect(formatInt(1234567)).toBe('1 234 567'))
test('formatNok never shows negative zero', () => expect(formatNok(-0)).toBe('0 NOK'))
test('formatNok rounds tiny negatives to plain zero', () => expect(formatNok(-0.3)).toBe('0 NOK'))
