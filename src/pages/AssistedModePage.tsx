import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSession } from '../state/SessionProvider'
import { useEvaluations } from '../engine/useEvaluations'
import { rankEvaluations } from '../engine/ranking'
import { useLocalized } from '../i18n'

const LARGE_TEXT_KEY = 'tt.assistedLargeText'

export function AssistedModePage() {
  const { t } = useI18n()
  const localize = useLocalized()
  const { state, dispatch } = useSession()
  const [largeText, setLargeText] = useState(() => localStorage.getItem(LARGE_TEXT_KEY) === 'true')
  const [confirming, setConfirming] = useState(false)
  const evaluations = useEvaluations(state.activePersonId)
  const ranked = rankEvaluations(evaluations)

  useEffect(() => {
    try {
      localStorage.setItem(LARGE_TEXT_KEY, String(largeText))
    } catch {
      // ignore
    }
    document.body.style.fontSize = largeText ? '22px' : ''
    return () => {
      document.body.style.fontSize = ''
    }
  }, [largeText])

  const handleReset = () => {
    dispatch({ type: 'resetAll' })
    setConfirming(false)
  }

  return (
    <div className="page">
      <h1>{t('assistedMode.title')}</h1>
      <p className="muted">{t('assistedMode.subtitle')}</p>

      <section className="card">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} style={{ width: 28, height: 28 }} />
          {t('assistedMode.largeTextMode')}
        </label>
      </section>

      <section className="card">
        <Link to="/question" className="btn btn-primary btn-block">
          {t('home.startButton')}
        </Link>
      </section>

      {ranked.length > 0 && (
        <section className="card">
          <h3>{t('assistedMode.sessionSummary')}</h3>
          <ul>
            {ranked.map((r) => (
              <li key={r.scheme.id}>{localize(r.scheme.name)}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => window.print()}>
            {t('results.printSummary')}
          </button>
        </section>
      )}

      <section className="card">
        {!confirming ? (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setConfirming(true)}>
            {t('assistedMode.resetForNextPerson')}
          </button>
        ) : (
          <div className="stack">
            <p>{t('assistedMode.resetConfirm')}</p>
            <button type="button" className="btn btn-primary btn-block" onClick={handleReset}>
              {t('common.confirm')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirming(false)}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
