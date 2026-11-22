import type { LocalizedText } from './localized'
import type { AnswerValue } from './questions'

/**
 * A safe, declarative, JSON-serializable condition language.
 * There is no "eval" anywhere -- every operator below is interpreted by
 * src/engine/ruleEvaluator.ts. Data files can never execute arbitrary code.
 */
export type Condition =
  | { op: 'eq'; field: string; value: AnswerValue }
  | { op: 'neq'; field: string; value: AnswerValue }
  | { op: 'gte'; field: string; value: number }
  | { op: 'lte'; field: string; value: number }
  | { op: 'gt'; field: string; value: number }
  | { op: 'lt'; field: string; value: number }
  | { op: 'between'; field: string; min: number; max: number }
  | { op: 'in'; field: string; values: AnswerValue[] }
  | { op: 'notIn'; field: string; values: AnswerValue[] }
  | { op: 'includesAny'; field: string; values: string[] } // for multiEnum
  | { op: 'exists'; field: string }
  | { op: 'and'; conditions: Condition[] }
  | { op: 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition }

/** Three-valued logic result: a rule can be true, false, or unknown (unanswered). */
export type TriState = 'true' | 'false' | 'unknown'

export interface Criterion {
  id: string
  condition: Condition
  /** Shown to the user to explain why they did/didn't match. */
  explanation: LocalizedText
  /**
   * For numeric gte/lte/gt/lt/between conditions only: how close a "false"
   * result can be and still count as a near-miss ("almost eligible").
   * Expressed in the same unit as the field (e.g. rupees, years).
   */
  nearMissMargin?: number
  /** Guidance shown when this criterion is the reason for a near-miss. */
  nearMissGuidance?: LocalizedText
}
