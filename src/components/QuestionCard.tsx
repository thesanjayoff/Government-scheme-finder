import { useState } from 'react'
import type { QuestionDef, AnswerValue } from '../types/questions'
import { useI18n, useLocalized } from '../i18n'
import { useVoice } from '../voice/useVoice'

interface Props {
  question: QuestionDef
  value: AnswerValue | undefined
  onAnswer: (value: AnswerValue) => void
  onSkip: () => void
}

export function QuestionCard({ question, value, onAnswer, onSkip }: Props) {
  const { t } = useI18n()
  const localize = useLocalized()
  const { speak, listen, isListening, isSpeaking, isSupported } = useVoice()
  const [numberDraft, setNumberDraft] = useState(value !== undefined ? String(value) : '')
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const handleListen = async () => {
    setVoiceError(null)
    const heard = await listen()
    if (!heard) {
      setVoiceError(t('question.listening'))
      return
    }
    if (question.type === 'number') {
      const n = heard.match(/\d+(\.\d+)?/)
      if (n) {
        setNumberDraft(n[0])
        onAnswer(Number(n[0]))
      }
    } else if (question.type === 'boolean') {
      const lower = heard.toLowerCase()
      if (/yes|ஆம்|ஆமா/.test(lower)) onAnswer(true)
      else if (/no|இல்லை/.test(lower)) onAnswer(false)
    } else if (question.type === 'enum' && question.options) {
      const match = question.options.find(
        (opt) =>
          localize(opt.label).toLowerCase().includes(heard.toLowerCase()) ||
          heard.toLowerCase().includes(localize(opt.label).toLowerCase()),
      )
      if (match) onAnswer(match.value)
    }
  }

  return (
    <div className="card" role="group" aria-labelledby="question-label">
      {question.sensitive && (
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          {t('question.sensitiveNotice')}
        </p>
      )}

      <h2 id="question-label">{localize(question.label)}</h2>

      {question.helpText && <p className="muted">{localize(question.helpText)}</p>}

      <div className="stack" style={{ flexDirection: 'row', marginBottom: '1rem' }}>
        <button type="button" className="btn btn-ghost" onClick={() => speak(localize(question.label))} aria-label={t('question.speakQuestion')}>
          {isSpeaking ? '🔊…' : '🔊'} {t('question.speakQuestion')}
        </button>
        {isSupported && (
          <button type="button" className="btn btn-ghost" onClick={handleListen} aria-label={t('question.speakAnswer')}>
            {isListening ? '🎙️…' : '🎙️'} {t('question.speakAnswer')}
          </button>
        )}
      </div>
      {voiceError && <p className="muted" role="status">{t('question.listening')}</p>}

      {question.whyWeAsk && (
        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('question.why')}</summary>
          <p className="muted">{localize(question.whyWeAsk)}</p>
        </details>
      )}

      {question.type === 'boolean' && (
        <div className="option-grid">
          {[
            { v: true, label: t('common.yes') },
            { v: false, label: t('common.no') },
          ].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              className="option-btn"
              aria-pressed={value === opt.v}
              onClick={() => onAnswer(opt.v)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'enum' && question.options && (
        <div className="option-grid">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="option-btn"
              aria-pressed={value === opt.value}
              onClick={() => onAnswer(opt.value)}
            >
              {localize(opt.label)}
            </button>
          ))}
        </div>
      )}

      {question.type === 'number' && (
        <div className="stack">
          <label htmlFor="number-input" className="sr-only">
            {localize(question.label)}
          </label>
          <input
            id="number-input"
            type="number"
            inputMode="decimal"
            min={question.min}
            max={question.max}
            value={numberDraft}
            onChange={(e) => setNumberDraft(e.target.value)}
            style={{ minHeight: 'var(--touch-target)', fontSize: '1.3rem', padding: '0.5em', borderRadius: 'var(--radius)', border: '2px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          {question.unit && <span className="muted">{localize(question.unit)}</span>}
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={numberDraft === ''}
            onClick={() => onAnswer(Number(numberDraft))}
          >
            {t('question.next')}
          </button>
        </div>
      )}

      <div className="stack" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onSkip}>
          {t('question.skip')}
        </button>
      </div>
    </div>
  )
}
