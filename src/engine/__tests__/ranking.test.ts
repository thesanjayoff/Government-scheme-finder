import { describe, it, expect } from 'vitest'
import { rankEvaluations, isStale } from '../ranking'
import { evaluateScheme } from '../ruleEvaluator'
import { makeScheme } from './testFixtures'

describe('isStale', () => {
  it('is false for a recently verified date', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(isStale(today)).toBe(false)
  })

  it('is true for a date far in the past', () => {
    expect(isStale('2000-01-01')).toBe(true)
  })
})

describe('rankEvaluations', () => {
  const eligibleHighValue = makeScheme({ id: 'high', benefitValue: 5, eligibilityCriteria: [] })
  const eligibleLowValue = makeScheme({ id: 'low', benefitValue: 1, eligibilityCriteria: [] })
  const notEligible = makeScheme({
    id: 'no',
    benefitValue: 5,
    eligibilityCriteria: [{ id: 'x', condition: { op: 'eq', field: 'gender', value: 'male' }, explanation: { ta: '', en: '' } }],
  })

  const evaluations = [eligibleLowValue, eligibleHighValue, notEligible].map((s) =>
    evaluateScheme(s, { gender: 'female' }),
  )

  it('never includes not-eligible schemes', () => {
    const ranked = rankEvaluations(evaluations)
    expect(ranked.find((r) => r.scheme.id === 'no')).toBeUndefined()
  })

  it('ranks higher benefit value first among equal outcomes', () => {
    const ranked = rankEvaluations(evaluations)
    expect(ranked[0].scheme.id).toBe('high')
  })
})
