import { render, screen } from '@testing-library/react'
import { GrowthCurve } from './GrowthCurve'
import { DEFAULT_STATE } from '../state/types'
import { t } from '../i18n/nb'

test('sentence for reachable growth', () => {
  render(<GrowthCurve state={DEFAULT_STATE} />)
  expect(screen.getByTestId('growth-sentence')).toHaveTextContent(t.growthSentence('35 000 kr', '2,36 %', 3))
})

test('sentence for unreachable growth', () => {
  render(<GrowthCurve state={{ ...DEFAULT_STATE, inputs: { ...DEFAULT_STATE.inputs, insurance: 2_000_000 }, startRent: 1000 }} />)
  expect(screen.getByTestId('growth-sentence')).toHaveTextContent(t.growthUnreachable(3))
})
