/* eslint-disable no-console */
import { evaluateScheme } from '../../src/engine/ruleEvaluator'
import { rankEvaluations } from '../../src/engine/ranking'
import { loadAllSchemesFromDisk } from './loadSchemesNode'
import { PERSONAS, FULL_PERSONAS } from './personas'
import { ORACLE, type OracleOutcome } from './oracle'
import { selectNextQuestion } from '../../src/engine/questionSelector'
import type { AnswerMap } from '../../src/types/questions'

const TOP_N = 5

const ALL_SCHEMES_INCLUDING_DRAFTS = loadAllSchemesFromDisk()
const schemesById = new Map(ALL_SCHEMES_INCLUDING_DRAFTS.map((s) => [s.id, s]))
const oracleSchemeIds = Object.keys(ORACLE).filter((id) => schemesById.has(id))

interface Mismatch {
  personaId: string
  schemeId: string
  expected: OracleOutcome
  actual: OracleOutcome
}

let total = 0
const mismatches: Mismatch[] = []
// Confusion counts, treating "eligible" OR "almost-eligible" as a positive prediction.
let truePositive = 0
let falsePositive = 0
let falseNegative = 0
let trueNegative = 0
let nearMissExpected = 0
let nearMissCorrect = 0

function isPositive(o: OracleOutcome) {
  return o === 'eligible' || o === 'almost-eligible'
}

for (const persona of PERSONAS) {
  for (const schemeId of oracleSchemeIds) {
    const scheme = schemesById.get(schemeId)!
    const expected = ORACLE[schemeId](persona.answers)
    const actual = evaluateScheme(scheme, persona.answers).outcome
    total++

    if (expected !== actual) mismatches.push({ personaId: persona.id, schemeId, expected, actual })

    const expPos = isPositive(expected)
    const actPos = isPositive(actual)
    if (expPos && actPos) truePositive++
    else if (!expPos && actPos) falsePositive++
    else if (expPos && !actPos) falseNegative++
    else trueNegative++

    if (expected === 'almost-eligible') {
      nearMissExpected++
      if (actual === 'almost-eligible') nearMissCorrect++
    }
  }
}

const precision = truePositive / (truePositive + falsePositive || 1)
const recall = truePositive / (truePositive + falseNegative || 1)
const accuracy = (total - mismatches.length) / total
const nearMissAccuracy = nearMissExpected ? nearMissCorrect / nearMissExpected : 1

console.log('=== Eligibility correctness (engine vs. independent oracle) ===')
console.log(`Personas: ${PERSONAS.length}, schemes covered by oracle: ${oracleSchemeIds.length}, assertions: ${total}`)
console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`)
console.log(`Precision (positive = eligible/almost-eligible): ${(precision * 100).toFixed(1)}%`)
console.log(`Recall: ${(recall * 100).toFixed(1)}%`)
console.log(`Near-miss accuracy: ${(nearMissAccuracy * 100).toFixed(1)}% (${nearMissCorrect}/${nearMissExpected})`)
console.log(`Confusion: TP=${truePositive} FP=${falsePositive} FN=${falseNegative} TN=${trueNegative}`)

if (mismatches.length) {
  console.log(`\n--- ${mismatches.length} mismatch(es) ---`)
  for (const m of mismatches) {
    console.log(`  persona=${m.personaId} scheme=${m.schemeId} expected=${m.expected} actual=${m.actual}`)
  }
} else {
  console.log('\nNo mismatches between the engine and the independent oracle.')
}

// --- Question efficiency ---
// Uses FULL_PERSONAS (every field answerable) so the selector's stopping
// point reflects genuine result convergence, not "ran out of fields to ask".
console.log('\n=== Question efficiency (adaptive selector, fully-answerable personas) ===')
const schemesForSelector = ALL_SCHEMES_INCLUDING_DRAFTS

/** The top-N ranked scheme ids a user would actually see on the results page at this point. */
function topSchemeIds(answers: AnswerMap): string[] {
  const evaluations = schemesForSelector.map((s) => evaluateScheme(s, answers))
  return rankEvaluations(evaluations)
    .slice(0, TOP_N)
    .map((e) => e.scheme.id)
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && new Set(a).size === new Set([...a, ...b]).size
}

const VERBOSE = process.argv.includes('--verbose')
let totalQuestions = 0
let maxQuestions = 0
let changedInLastThree = 0

for (const persona of FULL_PERSONAS) {
  const asked = new Set<string>()
  const answers: AnswerMap = {}
  const snapshots: string[][] = [topSchemeIds(answers)]

  let count = 0
  const order: string[] = []
  while (count < 30) {
    const next = selectNextQuestion(schemesForSelector, answers, { askedIds: asked, skippedIds: new Set() })
    if (!next) break
    const value = persona.answers[next.id]
    if (value === undefined) break // this persona has no answer -- stop rather than fake one
    answers[next.id] = value
    asked.add(next.id)
    count++
    order.push(next.id)
    snapshots.push(topSchemeIds(answers))
  }

  totalQuestions += count
  maxQuestions = Math.max(maxQuestions, count)
  if (VERBOSE) console.log(`  ${persona.id}: ${count} questions -- ${order.join(', ')}`)

  const final = snapshots[snapshots.length - 1]
  const threeBefore = snapshots[Math.max(0, snapshots.length - 1 - 3)]
  if (!sameIds(final, threeBefore)) changedInLastThree++
}

console.log(`Average questions to reach stable results: ${(totalQuestions / FULL_PERSONAS.length).toFixed(1)}`)
console.log(`Maximum questions: ${maxQuestions}`)
console.log(
  `Share of personas whose top-${TOP_N} results still changed in the last 3 questions: ${((changedInLastThree / FULL_PERSONAS.length) * 100).toFixed(0)}% (${changedInLastThree}/${FULL_PERSONAS.length})`,
)

process.exit(mismatches.length > 0 ? 1 : 0)
