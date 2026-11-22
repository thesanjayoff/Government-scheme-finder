import type { AnswerMap, AnswerValue } from '../types/questions'
import type { Condition, Criterion, TriState } from '../types/rules'
import type { Scheme } from '../types/scheme'
import type { LocalizedText } from '../types/localized'

/**
 * Pure, deterministic, offline rule evaluator.
 * No network access, no `eval`, no dynamic code execution of any kind --
 * every Condition is a plain data literal interpreted by the switch below.
 */

function isAnswered(value: AnswerValue | undefined): value is AnswerValue {
  return value !== undefined && value !== null && value !== ''
}

function toNumber(value: AnswerValue | undefined): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return undefined
}

/** Evaluates a single Condition against answers. Returns 'unknown' if a referenced field is unanswered. */
export function evaluateCondition(condition: Condition, answers: AnswerMap): TriState {
  switch (condition.op) {
    case 'and': {
      const results = condition.conditions.map((c) => evaluateCondition(c, answers))
      if (results.some((r) => r === 'false')) return 'false'
      if (results.some((r) => r === 'unknown')) return 'unknown'
      return 'true'
    }
    case 'or': {
      const results = condition.conditions.map((c) => evaluateCondition(c, answers))
      if (results.some((r) => r === 'true')) return 'true'
      if (results.some((r) => r === 'unknown')) return 'unknown'
      return 'false'
    }
    case 'not': {
      const result = evaluateCondition(condition.condition, answers)
      if (result === 'true') return 'false'
      if (result === 'false') return 'true'
      return 'unknown'
    }
    case 'exists': {
      return isAnswered(answers[condition.field]) ? 'true' : 'false'
    }
    case 'eq': {
      const v = answers[condition.field]
      if (!isAnswered(v)) return 'unknown'
      return v === condition.value ? 'true' : 'false'
    }
    case 'neq': {
      const v = answers[condition.field]
      if (!isAnswered(v)) return 'unknown'
      return v !== condition.value ? 'true' : 'false'
    }
    case 'in': {
      const v = answers[condition.field]
      if (!isAnswered(v)) return 'unknown'
      return condition.values.includes(v) ? 'true' : 'false'
    }
    case 'notIn': {
      const v = answers[condition.field]
      if (!isAnswered(v)) return 'unknown'
      return !condition.values.includes(v) ? 'true' : 'false'
    }
    case 'includesAny': {
      const v = answers[condition.field]
      if (!isAnswered(v)) return 'unknown'
      if (!Array.isArray(v)) return 'false'
      return v.some((item) => condition.values.includes(item)) ? 'true' : 'false'
    }
    case 'gte': {
      const n = toNumber(answers[condition.field])
      if (n === undefined) return 'unknown'
      return n >= condition.value ? 'true' : 'false'
    }
    case 'lte': {
      const n = toNumber(answers[condition.field])
      if (n === undefined) return 'unknown'
      return n <= condition.value ? 'true' : 'false'
    }
    case 'gt': {
      const n = toNumber(answers[condition.field])
      if (n === undefined) return 'unknown'
      return n > condition.value ? 'true' : 'false'
    }
    case 'lt': {
      const n = toNumber(answers[condition.field])
      if (n === undefined) return 'unknown'
      return n < condition.value ? 'true' : 'false'
    }
    case 'between': {
      const n = toNumber(answers[condition.field])
      if (n === undefined) return 'unknown'
      return n >= condition.min && n <= condition.max ? 'true' : 'false'
    }
    default:
      // Exhaustiveness guard -- if this fires, a new Condition variant was
      // added without a handler. Treat defensively as unknown.
      return 'unknown'
  }
}

/** Collects every field name referenced anywhere inside a Condition tree. */
export function collectFields(condition: Condition, out: Set<string> = new Set()): Set<string> {
  switch (condition.op) {
    case 'and':
    case 'or':
      condition.conditions.forEach((c) => collectFields(c, out))
      return out
    case 'not':
      collectFields(condition.condition, out)
      return out
    default:
      out.add(condition.field)
      return out
  }
}

/** For numeric leaf conditions, the distance between the answer and the threshold, in field units. Undefined if not numeric/answered. */
function numericDistance(condition: Condition, answers: AnswerMap): number | undefined {
  const n = toNumber(answers[(condition as { field: string }).field])
  if (n === undefined) return undefined
  switch (condition.op) {
    case 'gte':
    case 'gt':
      return condition.value - n // positive => short of the threshold
    case 'lte':
    case 'lt':
      return n - condition.value
    case 'between':
      if (n < condition.min) return condition.min - n
      if (n > condition.max) return n - condition.max
      return 0
    default:
      return undefined
  }
}

export type CriterionStatus = {
  criterion: Criterion
  result: TriState
  /** true if result is 'false' but within the criterion's nearMissMargin. */
  isNearMiss: boolean
}

function evaluateCriterion(criterion: Criterion, answers: AnswerMap): CriterionStatus {
  const result = evaluateCondition(criterion.condition, answers)
  let isNearMiss = false
  if (result === 'false' && criterion.nearMissMargin !== undefined) {
    const distance = numericDistance(criterion.condition, answers)
    if (distance !== undefined && distance > 0 && distance <= criterion.nearMissMargin) {
      isNearMiss = true
    }
  }
  return { criterion, result, isNearMiss }
}

export type SchemeOutcome = 'eligible' | 'almost-eligible' | 'not-eligible' | 'unknown'

export interface SchemeEvaluation {
  scheme: Scheme
  outcome: SchemeOutcome
  criteriaStatus: CriterionStatus[]
  exclusionStatus: CriterionStatus[]
  /** Criteria/exclusions that drove the outcome, for explanation UI. */
  matchedCriteria: CriterionStatus[]
  failedCriteria: CriterionStatus[]
  nearMissCriteria: CriterionStatus[]
  unknownCriteria: CriterionStatus[]
  matchedExclusion?: CriterionStatus
}

/**
 * Evaluates one scheme against one person's (merged household+person) answers.
 * Deterministic and side-effect free: same answers always give the same result.
 */
export function evaluateScheme(scheme: Scheme, answers: AnswerMap): SchemeEvaluation {
  const exclusionStatus = scheme.exclusions.map((c) => evaluateCriterion(c, answers))
  const matchedExclusion = exclusionStatus.find((e) => e.result === 'true')

  const criteriaStatus = scheme.eligibilityCriteria.map((c) => evaluateCriterion(c, answers))
  const matchedCriteria = criteriaStatus.filter((c) => c.result === 'true')
  const failedCriteria = criteriaStatus.filter((c) => c.result === 'false' && !c.isNearMiss)
  const nearMissCriteria = criteriaStatus.filter((c) => c.result === 'false' && c.isNearMiss)
  const unknownCriteria = criteriaStatus.filter((c) => c.result === 'unknown')

  let outcome: SchemeOutcome

  // All hard criteria pass once we get here (no exclusion, no hard fail).
  // Per the product spec: "Almost eligible" = missing one or two criteria or
  // pieces of information; "Unknown" = needs (more, or more fundamental)
  // information. A scheme where NOTHING has been confirmed yet (every
  // criterion is still unanswered, with no near-miss signal either) is
  // "Unknown", not "Almost eligible", even if it only has 1-2 criteria --
  // "almost" implies some positive signal already, not a blank slate.
  const pendingCount = nearMissCriteria.length + unknownCriteria.length
  const totalCriteria = criteriaStatus.length
  const nothingConfirmedYet =
    totalCriteria > 0 && matchedCriteria.length === 0 && nearMissCriteria.length === 0 && unknownCriteria.length === totalCriteria

  if (matchedExclusion) {
    outcome = 'not-eligible'
  } else if (failedCriteria.length > 0) {
    outcome = 'not-eligible'
  } else if (pendingCount === 0) {
    outcome = 'eligible'
  } else if (nothingConfirmedYet) {
    outcome = 'unknown'
  } else if (pendingCount <= 2) {
    outcome = 'almost-eligible'
  } else {
    outcome = 'unknown'
  }

  return {
    scheme,
    outcome,
    criteriaStatus,
    exclusionStatus,
    matchedCriteria,
    failedCriteria,
    nearMissCriteria,
    unknownCriteria,
    matchedExclusion,
  }
}

export interface NearMissGuidance {
  criterionId: string
  guidance: LocalizedText
}

/** What would need to change for an almost-eligible / unknown scheme to become eligible. */
export function getNearMissGuidance(evaluation: SchemeEvaluation): NearMissGuidance[] {
  return [...evaluation.nearMissCriteria, ...evaluation.unknownCriteria]
    .filter((c) => c.criterion.nearMissGuidance || c.result === 'unknown')
    .map((c) => ({
      criterionId: c.criterion.id,
      guidance: c.criterion.nearMissGuidance ?? c.criterion.explanation,
    }))
}
