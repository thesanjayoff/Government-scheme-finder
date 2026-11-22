import { describe, it, expect } from 'vitest'
import { selectNextQuestion, isResultStable } from '../questionSelector'
import { makeScheme } from './testFixtures'

describe('selectNextQuestion', () => {
  it('returns null when there are no in-play schemes', () => {
    const schemes = [
      makeScheme({
        id: 's1',
        eligibilityCriteria: [{ id: 'age', condition: { op: 'gte', field: 'age', value: 60 }, explanation: { ta: '', en: '' } }],
      }),
    ]
    expect(selectNextQuestion(schemes, { age: 10 })).toBeNull()
  })

  it('prefers a non-sensitive question over a sensitive one that resolves fewer schemes', () => {
    const schemes = [
      makeScheme({
        id: 's1',
        eligibilityCriteria: [
          { id: 'age', condition: { op: 'gte', field: 'age', value: 18 }, explanation: { ta: '', en: '' } },
        ],
      }),
      makeScheme({
        id: 's2',
        eligibilityCriteria: [
          { id: 'disability', condition: { op: 'gte', field: 'disabilityPercentage', value: 40 }, explanation: { ta: '', en: '' } },
        ],
      }),
    ]
    const next = selectNextQuestion(schemes, {})
    expect(next?.id).toBe('age')
    expect(next?.sensitive).toBe(false)
  })

  it('falls back to a sensitive question once it is the only remaining source of information', () => {
    const schemes = [
      makeScheme({
        id: 's2',
        eligibilityCriteria: [
          { id: 'disability', condition: { op: 'gte', field: 'disabilityPercentage', value: 40 }, explanation: { ta: '', en: '' } },
        ],
      }),
    ]
    const next = selectNextQuestion(schemes, {})
    expect(next?.id).toBe('disabilityPercentage')
  })

  it('never re-asks a question already asked or skipped', () => {
    const schemes = [
      makeScheme({
        id: 's1',
        eligibilityCriteria: [{ id: 'age', condition: { op: 'gte', field: 'age', value: 18 }, explanation: { ta: '', en: '' } }],
      }),
    ]
    const next = selectNextQuestion(schemes, {}, { askedIds: new Set(['age']) })
    expect(next).toBeNull()
  })

  it('isResultStable is true once no further question can change the outcome', () => {
    const schemes = [
      makeScheme({
        id: 's1',
        eligibilityCriteria: [{ id: 'age', condition: { op: 'gte', field: 'age', value: 18 }, explanation: { ta: '', en: '' } }],
      }),
    ]
    expect(isResultStable(schemes, { age: 30 }, new Set(['age']), new Set())).toBe(true)
  })

  it('deprioritises a scheme with no confirmed match yet in favour of one already partially matched', () => {
    // s1 has 2 criteria and already matched 1 (state) -- a clear majority once
    // its 2nd criterion (age) is also resolved. s2 has 3 criteria and none
    // answered yet, so it has no signal at all. The selector should finish
    // the already-promising s1 (by asking "age") rather than pivot to a
    // completely cold scheme's field.
    const schemes = [
      makeScheme({
        id: 's1',
        eligibilityCriteria: [
          { id: 'state', condition: { op: 'eq', field: 'state', value: 'tamil-nadu' }, explanation: { ta: '', en: '' } },
          { id: 'age', condition: { op: 'gte', field: 'age', value: 18 }, explanation: { ta: '', en: '' } },
        ],
      }),
      makeScheme({
        id: 's2',
        eligibilityCriteria: [
          { id: 'c1', condition: { op: 'eq', field: 'maritalStatus', value: 'widowed' }, explanation: { ta: '', en: '' } },
          { id: 'c2', condition: { op: 'eq', field: 'occupation', value: 'farmer' }, explanation: { ta: '', en: '' } },
          { id: 'c3', condition: { op: 'eq', field: 'rationCardType', value: 'bpl' }, explanation: { ta: '', en: '' } },
        ],
      }),
    ]
    const next = selectNextQuestion(schemes, { state: 'tamil-nadu' })
    expect(next?.id).toBe('age')
  })
})
