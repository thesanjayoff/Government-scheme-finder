import { useMemo } from 'react'
import { SCHEMES } from '../data/loadSchemes'
import { selectNextQuestion, isResultStable } from './questionSelector'
import { useMergedAnswers, useAskedAndSkipped } from './useEvaluations'
import type { QuestionDef } from '../types/questions'

export function useNextQuestion(personId: string): { next: QuestionDef | null; stable: boolean } {
  const answers = useMergedAnswers(personId)
  const { askedIds, skippedIds } = useAskedAndSkipped(personId)

  return useMemo(() => {
    const next = selectNextQuestion(SCHEMES, answers, { askedIds, skippedIds })
    return { next, stable: next === null || isResultStable(SCHEMES, answers, askedIds, skippedIds) }
  }, [answers, askedIds, skippedIds])
}
