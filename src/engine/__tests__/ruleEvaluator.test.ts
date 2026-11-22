import { describe, it, expect } from 'vitest'
import { evaluateCondition, evaluateScheme, collectFields } from '../ruleEvaluator'
import { makeScheme } from './testFixtures'
import type { Condition } from '../../types/rules'

describe('evaluateCondition - three-valued logic', () => {
  it('returns unknown when the field is unanswered', () => {
    expect(evaluateCondition({ op: 'gte', field: 'age', value: 60 }, {})).toBe('unknown')
  })

  it('gte boundary: age exactly 60 is true', () => {
    expect(evaluateCondition({ op: 'gte', field: 'age', value: 60 }, { age: 60 })).toBe('true')
  })

  it('gte boundary: age 59 is false', () => {
    expect(evaluateCondition({ op: 'gte', field: 'age', value: 60 }, { age: 59 })).toBe('false')
  })

  it('lte boundary: income exactly at ceiling is true', () => {
    expect(
      evaluateCondition({ op: 'lte', field: 'householdIncomeAnnual', value: 100000 }, { householdIncomeAnnual: 100000 }),
    ).toBe('true')
  })

  it('lte boundary: income one rupee over ceiling is false', () => {
    expect(
      evaluateCondition({ op: 'lte', field: 'householdIncomeAnnual', value: 100000 }, { householdIncomeAnnual: 100001 }),
    ).toBe('false')
  })

  it('between is inclusive on both ends', () => {
    const cond: Condition = { op: 'between', field: 'age', min: 18, max: 40 }
    expect(evaluateCondition(cond, { age: 18 })).toBe('true')
    expect(evaluateCondition(cond, { age: 40 })).toBe('true')
    expect(evaluateCondition(cond, { age: 17 })).toBe('false')
    expect(evaluateCondition(cond, { age: 41 })).toBe('false')
  })

  it('and short-circuits to false if any branch is false, even if another is unknown', () => {
    const cond: Condition = {
      op: 'and',
      conditions: [
        { op: 'gte', field: 'age', value: 60 },
        { op: 'eq', field: 'gender', value: 'female' },
      ],
    }
    expect(evaluateCondition(cond, { age: 10 })).toBe('false') // gender unknown, age false -> false
  })

  it('and is unknown if no branch is false but at least one is unknown', () => {
    const cond: Condition = {
      op: 'and',
      conditions: [
        { op: 'gte', field: 'age', value: 60 },
        { op: 'eq', field: 'gender', value: 'female' },
      ],
    }
    expect(evaluateCondition(cond, { age: 65 })).toBe('unknown')
  })

  it('or is true if any branch is true, even if another is unknown', () => {
    const cond: Condition = {
      op: 'or',
      conditions: [
        { op: 'eq', field: 'maritalStatus', value: 'widowed' },
        { op: 'eq', field: 'disabilityPercentage', value: 40 },
      ],
    }
    expect(evaluateCondition(cond, { maritalStatus: 'widowed' })).toBe('true')
  })

  it('not flips true/false and leaves unknown as unknown', () => {
    expect(evaluateCondition({ op: 'not', condition: { op: 'exists', field: 'age' } }, {})).toBe('true')
    expect(evaluateCondition({ op: 'not', condition: { op: 'exists', field: 'age' } }, { age: 1 })).toBe('false')
  })

  it('in/notIn/includesAny behave as expected', () => {
    expect(evaluateCondition({ op: 'in', field: 'state', values: ['tamil-nadu'] }, { state: 'tamil-nadu' })).toBe('true')
    expect(evaluateCondition({ op: 'notIn', field: 'state', values: ['tamil-nadu'] }, { state: 'tamil-nadu' })).toBe(
      'false',
    )
    expect(
      evaluateCondition({ op: 'includesAny', field: 'tags', values: ['a', 'b'] }, { tags: ['b', 'c'] }),
    ).toBe('true')
  })
})

describe('collectFields', () => {
  it('collects every leaf field including nested and/or/not', () => {
    const cond: Condition = {
      op: 'and',
      conditions: [
        { op: 'gte', field: 'age', value: 60 },
        { op: 'not', condition: { op: 'eq', field: 'gender', value: 'male' } },
      ],
    }
    expect([...collectFields(cond)].sort()).toEqual(['age', 'gender'])
  })
})

describe('evaluateScheme outcomes', () => {
  it('eligible when all criteria are true and no exclusion matches', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'age', condition: { op: 'gte', field: 'age', value: 60 }, explanation: { ta: '', en: '' } },
      ],
    })
    const result = evaluateScheme(scheme, { age: 70 })
    expect(result.outcome).toBe('eligible')
  })

  it('not-eligible when a criterion is hard-false (outside near-miss margin)', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        {
          id: 'age',
          condition: { op: 'gte', field: 'age', value: 60 },
          explanation: { ta: '', en: '' },
          nearMissMargin: 2,
        },
      ],
    })
    const result = evaluateScheme(scheme, { age: 50 }) // 10 years short, outside margin of 2
    expect(result.outcome).toBe('not-eligible')
  })

  it('almost-eligible when a criterion is false but within the near-miss margin', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        {
          id: 'age',
          condition: { op: 'gte', field: 'age', value: 60 },
          explanation: { ta: '', en: '' },
          nearMissMargin: 2,
        },
      ],
    })
    const result = evaluateScheme(scheme, { age: 59 }) // 1 year short, within margin of 2
    expect(result.outcome).toBe('almost-eligible')
    expect(result.nearMissCriteria).toHaveLength(1)
  })

  it('unknown when a criterion is unanswered and none are hard-false', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'age', condition: { op: 'gte', field: 'age', value: 60 }, explanation: { ta: '', en: '' } },
      ],
    })
    const result = evaluateScheme(scheme, {})
    expect(result.outcome).toBe('unknown')
  })

  it('almost-eligible when 1-2 criteria are pending but at least one is already confirmed', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'state', condition: { op: 'eq', field: 'state', value: 'tamil-nadu' }, explanation: { ta: '', en: '' } },
        { id: 'income', condition: { op: 'lte', field: 'householdIncomeAnnual', value: 100000 }, explanation: { ta: '', en: '' } },
      ],
    })
    // state matches; income is unanswered -- 1 confirmed + 1 pending => almost, not unknown.
    const result = evaluateScheme(scheme, { state: 'tamil-nadu' })
    expect(result.outcome).toBe('almost-eligible')
  })

  it('unknown (not almost-eligible) when nothing has been confirmed yet, even with few criteria', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'state', condition: { op: 'eq', field: 'state', value: 'tamil-nadu' }, explanation: { ta: '', en: '' } },
        { id: 'income', condition: { op: 'lte', field: 'householdIncomeAnnual', value: 100000 }, explanation: { ta: '', en: '' } },
      ],
    })
    // Nothing answered at all -- a blank slate is "need more information", not "almost eligible".
    const result = evaluateScheme(scheme, {})
    expect(result.outcome).toBe('unknown')
  })

  it('unknown when more than 2 criteria are pending', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'c1', condition: { op: 'eq', field: 'state', value: 'tamil-nadu' }, explanation: { ta: '', en: '' } },
        { id: 'c2', condition: { op: 'eq', field: 'maritalStatus', value: 'widowed' }, explanation: { ta: '', en: '' } },
        { id: 'c3', condition: { op: 'eq', field: 'occupation', value: 'farmer' }, explanation: { ta: '', en: '' } },
        { id: 'c4', condition: { op: 'eq', field: 'rationCardType', value: 'bpl' }, explanation: { ta: '', en: '' } },
      ],
    })
    // One confirmed match (state), but 3 still pending -- too much missing to call it "almost".
    const result = evaluateScheme(scheme, { state: 'tamil-nadu' })
    expect(result.outcome).toBe('unknown')
  })

  it('not-eligible when an exclusion matches, regardless of criteria', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'age', condition: { op: 'gte', field: 'age', value: 60 }, explanation: { ta: '', en: '' } },
      ],
      exclusions: [
        {
          id: 'already-pensioned',
          condition: { op: 'eq', field: 'receivesPension', value: 'old-age-pension' },
          explanation: { ta: '', en: '' },
        },
      ],
    })
    const result = evaluateScheme(scheme, { age: 70, receivesPension: 'old-age-pension' })
    expect(result.outcome).toBe('not-eligible')
    expect(result.matchedExclusion).toBeDefined()
  })

  it('is deterministic: same answers always give the same outcome', () => {
    const scheme = makeScheme({
      eligibilityCriteria: [
        { id: 'age', condition: { op: 'gte', field: 'age', value: 18 }, explanation: { ta: '', en: '' } },
        { id: 'state', condition: { op: 'eq', field: 'state', value: 'tamil-nadu' }, explanation: { ta: '', en: '' } },
      ],
    })
    const answers = { age: 25, state: 'tamil-nadu' as const }
    const r1 = evaluateScheme(scheme, answers)
    const r2 = evaluateScheme(scheme, answers)
    expect(r1.outcome).toBe(r2.outcome)
    expect(r1.outcome).toBe('eligible')
  })
})
