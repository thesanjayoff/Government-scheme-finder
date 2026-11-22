import type { QuestionDef, AnswerMap } from '../types/questions'
import type { Scheme } from '../types/scheme'
import { collectFields } from './ruleEvaluator'
import { evaluateScheme } from './ruleEvaluator'
import { QUESTION_BY_ID } from '../data/questions'

/**
 * Picks the question that most reduces uncertainty across the schemes that
 * are still "in play" (not yet definitively not-eligible). Non-sensitive
 * questions are preferred; a sensitive question is only offered once it is
 * the best remaining source of information.
 *
 * This is a simple, explainable greedy heuristic (not a full information-
 * theoretic model): for every unanswered field, count how many in-play
 * schemes have at least one currently-unknown criterion referencing that
 * field. The field touching the most schemes is asked next.
 */
export function selectNextQuestion(
  schemes: Scheme[],
  answers: AnswerMap,
  opts: { askedIds?: Set<string>; skippedIds?: Set<string> } = {},
): QuestionDef | null {
  const askedIds = opts.askedIds ?? new Set<string>()
  const skippedIds = opts.skippedIds ?? new Set<string>()

  const evaluations = schemes.map((s) => evaluateScheme(s, answers)).filter((e) => e.outcome !== 'not-eligible')
  if (evaluations.length === 0) return null

  // Once a scheme has at least some confirmed signal (a matched or
  // near-miss criterion), prioritise finishing it over asking about a
  // scheme we have zero information on yet -- this is what lets the flow
  // actually converge in ~6-8 questions instead of working through every
  // field every scheme might ever need. Schemes with zero signal still get
  // asked about during the initial "bootstrap" phase, when nothing has any
  // signal yet (otherwise the very first question could never be chosen).
  const touched = evaluations.filter((e) => {
    if (e.nearMissCriteria.length > 0) return true
    const total = e.criteriaStatus.length
    return total > 0 && e.matchedCriteria.length / total > 0.5
  })
  const inPlay = touched.length > 0 ? touched : evaluations

  const fieldScore = new Map<string, number>()

  for (const evaluation of inPlay) {
    const fieldsForScheme = new Set<string>()
    for (const status of evaluation.unknownCriteria) {
      collectFields(status.criterion.condition).forEach((f) => fieldsForScheme.add(f))
    }
    for (const field of fieldsForScheme) {
      if (askedIds.has(field) || skippedIds.has(field)) continue
      if (!QUESTION_BY_ID[field]) continue
      fieldScore.set(field, (fieldScore.get(field) ?? 0) + 1)
    }
  }

  if (fieldScore.size === 0) return null

  const candidates = [...fieldScore.entries()]
    .map(([field, score]) => ({ field, score, question: QUESTION_BY_ID[field] }))
    .filter((c) => c.question)

  // Prefer non-sensitive questions unless a sensitive one is strictly needed
  // to resolve more schemes than any remaining non-sensitive question.
  const nonSensitive = candidates.filter((c) => !c.question.sensitive)
  const sensitive = candidates.filter((c) => c.question.sensitive)

  const bestNonSensitive = nonSensitive.sort((a, b) => b.score - a.score)[0]
  const bestSensitive = sensitive.sort((a, b) => b.score - a.score)[0]

  if (bestNonSensitive && (!bestSensitive || bestNonSensitive.score >= bestSensitive.score)) {
    return bestNonSensitive.question
  }
  if (bestSensitive) return bestSensitive.question
  return null
}

/** True once asking further questions is unlikely to change the current result set. */
export function isResultStable(
  schemes: Scheme[],
  answers: AnswerMap,
  askedIds: Set<string>,
  skippedIds: Set<string>,
): boolean {
  return selectNextQuestion(schemes, answers, { askedIds, skippedIds }) === null
}
