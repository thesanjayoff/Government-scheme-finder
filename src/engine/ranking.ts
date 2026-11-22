import { APP_CONFIG } from '../config/appConfig'
import type { SchemeEvaluation } from './ruleEvaluator'

const OUTCOME_WEIGHT: Record<SchemeEvaluation['outcome'], number> = {
  eligible: 100,
  'almost-eligible': 60,
  unknown: 30,
  'not-eligible': -1,
}

const EFFORT_WEIGHT: Record<'low' | 'medium' | 'high', number> = {
  low: 3,
  medium: 2,
  high: 1,
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

export function isStale(lastVerified: string, staleAfterDays = APP_CONFIG.staleAfterDays): boolean {
  return daysSince(lastVerified) > staleAfterDays
}

export interface RankOptions {
  /** When true, sort purely by benefit value first ("highest value first"). */
  highestValueFirst?: boolean
}

/** Ranks evaluations: eligible/almost/unknown first (never shows not-eligible), by relevance, confidence, freshness, and effort. */
export function rankEvaluations(
  evaluations: SchemeEvaluation[],
  options: RankOptions = {},
): SchemeEvaluation[] {
  const visible = evaluations.filter((e) => e.outcome !== 'not-eligible')

  return [...visible].sort((a, b) => {
    if (options.highestValueFirst) {
      const valueDiff = b.scheme.benefitValue - a.scheme.benefitValue
      if (valueDiff !== 0) return valueDiff
    }

    const outcomeDiff = OUTCOME_WEIGHT[b.outcome] - OUTCOME_WEIGHT[a.outcome]
    if (outcomeDiff !== 0) return outcomeDiff

    const valueDiff = b.scheme.benefitValue - a.scheme.benefitValue
    if (valueDiff !== 0) return valueDiff

    const staleA = isStale(a.scheme.lastVerified) ? 1 : 0
    const staleB = isStale(b.scheme.lastVerified) ? 1 : 0
    if (staleA !== staleB) return staleA - staleB // fresher (0) ranks first

    const effortDiff = EFFORT_WEIGHT[b.scheme.applicationEffort] - EFFORT_WEIGHT[a.scheme.applicationEffort]
    if (effortDiff !== 0) return effortDiff

    return a.scheme.name.en.localeCompare(b.scheme.name.en)
  })
}
