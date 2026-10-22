import { formatInt, formatKr, formatPct } from './format'

test('formatKr uses space separator and kr', () => expect(formatKr(52216.4)).toBe('52 216 kr'))
test('formatKr rounds negatives', () => expect(formatKr(-1689177.2)).toBe('−1 689 177 kr'))
test('formatPct uses comma', () => expect(formatPct(0.0236)).toBe('2,36 %'))
test('formatPct with one decimal', () => expect(formatPct(0.035, 1)).toBe('3,5 %'))
test('formatInt', () => expect(formatInt(1234567)).toBe('1 234 567'))
