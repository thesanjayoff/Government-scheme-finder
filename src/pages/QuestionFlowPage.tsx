import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../state/SessionProvider'
import { useNextQuestion } from '../engine/useNextQuestion'
import { useMergedAnswers } from '../engine/useEvaluations'
import { QuestionCard } from '../components/QuestionCard'
import { useI18n } from '../i18n'
import type { AnswerValue } from '../types/questions'

const ESTIMATED_QUESTIONS = 7

export function QuestionFlowPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { state } = useSession()
  const personId = state.activePersonId
  const { next, stable } = useNextQuestion(personId)
  const answers = useMergedAnswers(personId)
  const [answeredCount, setAnsweredCount] = useState(0)
  const { dispatch } = useSession()

  useEffect(() => {
    setAnsweredCount(Object.keys(answers).length)
  }, [answers])

  useEffect(() => {
    if (!next && stable) {
      navigate('/results')
    }
  }, [next, stable, navigate])

  if (!next) {
    return (
      <div className="page">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  const handleAnswer = (value: AnswerValue) => {
    dispatch({ type: 'setAnswer', personId, questionId: next.id, value })
  }

  const handleSkip = () => {
    dispatch({ type: 'skipQuestion', personId, questionId: next.id })
  }

  const progress = Math.min(100, Math.round((answeredCount / ESTIMATED_QUESTIONS) * 100))

  return (
    <div className="page">
      <p className="muted" aria-live="polite">
        {t('question.progress', { current: answeredCount + 1, estimate: ESTIMATED_QUESTIONS })}
      </p>
      <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <QuestionCard
        key={next.id}
        question={next}
        value={answers[next.id]}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
      />

      <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/results')} style={{ marginTop: '1rem' }}>
        {t('question.seeResultsNow')}
      </button>
    </div>
  )
}
