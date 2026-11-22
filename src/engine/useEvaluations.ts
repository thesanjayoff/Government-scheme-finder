import { useMemo } from 'react'
import { useSession } from '../state/SessionProvider'
import { SCHEMES } from '../data/loadSchemes'
import { evaluateScheme, type SchemeEvaluation } from './ruleEvaluator'
import type { AnswerMap } from '../types/questions'

export function useMergedAnswers(personId: string): AnswerMap {
  const { state } = useSession()
  return useMemo(() => {
    const person = state.household.members.find((m) => m.id === personId)
    return { ...state.household.sharedAnswers, ...(person?.answers ?? {}) }
  }, [state.household, personId])
}

export function useAskedAndSkipped(personId: string): { askedIds: Set<string>; skippedIds: Set<string> } {
  const { state } = useSession()
  return useMemo(() => {
    const person = state.household.members.find((m) => m.id === personId)
    return {
      askedIds: new Set([...state.household.sharedAskedIds, ...(person?.askedIds ?? [])]),
      skippedIds: new Set([...state.household.sharedSkippedIds, ...(person?.skippedIds ?? [])]),
    }
  }, [state.household, personId])
}

export function useEvaluations(personId: string): SchemeEvaluation[] {
  const answers = useMergedAnswers(personId)
  return useMemo(() => SCHEMES.map((scheme) => evaluateScheme(scheme, answers)), [answers])
}
