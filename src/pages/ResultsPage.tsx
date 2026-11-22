import { useMemo } from 'react'
import { useSession } from '../state/SessionProvider'
import { useEvaluations } from '../engine/useEvaluations'
import { rankEvaluations } from '../engine/ranking'
import { SchemeCard } from '../components/SchemeCard'
import { useI18n } from '../i18n'
import { Link } from 'react-router-dom'

function PersonSwitcher() {
  const { state, dispatch } = useSession()
  if (state.household.members.length <= 1) return null
  return (
    <div className="stack" style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {state.household.members.map((m) => (
        <button
          key={m.id}
          type="button"
          className="btn btn-secondary"
          aria-pressed={state.activePersonId === m.id}
          onClick={() => dispatch({ type: 'setActivePerson', personId: m.id })}
        >
          {m.nickname}
        </button>
      ))}
    </div>
  )
}

export function ResultsPage() {
  const { t } = useI18n()
  const { state, dispatch } = useSession()
  const personId = state.activePersonId
  const evaluations = useEvaluations(personId)
  const ranked = useMemo(
    () => rankEvaluations(evaluations, { highestValueFirst: state.highestValueFirst }),
    [evaluations, state.highestValueFirst],
  )

  const stillNeeded = useMemo(() => {
    // Different schemes often name the same real-world document with different
    // internal ids (e.g. two "aadhaar-card" entries authored separately) -- dedupe
    // by the displayed name so the checklist doesn't show "Aadhaar card" five times.
    const docs = new Map<string, { name: string }>()
    ranked.forEach((r) =>
      r.scheme.requiredDocuments.forEach((d) => {
        if (!state.haveDocuments.includes(d.id)) docs.set(d.name.en, { name: d.name.en })
      }),
    )
    return [...docs.values()]
  }, [ranked, state.haveDocuments])

  return (
    <div className="page">
      <h1>{t('results.title')}</h1>
      <div className="disclaimer-box" style={{ marginBottom: '1rem' }}>
        {t('results.disclaimer')}
      </div>

      <PersonSwitcher />

      <div className="stack" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={state.highestValueFirst}
            onChange={(e) => dispatch({ type: 'setHighestValueFirst', value: e.target.checked })}
            style={{ width: 24, height: 24 }}
          />
          {t('results.sortHighestValue')}
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          {t('results.printSummary')}
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="card">
          <p>{t('results.noResults')}</p>
          <Link to="/question" className="btn btn-primary">
            {t('question.next')}
          </Link>
        </div>
      ) : (
        ranked.map((evaluation) => <SchemeCard key={evaluation.scheme.id} evaluation={evaluation} personId={personId} />)
      )}

      {stillNeeded.length > 0 && (
        <section className="card">
          <h3>{t('results.stillNeeded')}</h3>
          <ul>
            {stillNeeded.map((d) => (
              <li key={d.name}>{d.name}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h3>{t('results.antiScam.title')}</h3>
        <ul>
          <li>{t('results.antiScam.noFee')}</li>
          <li>{t('results.antiScam.noGuarantee')}</li>
          <li>{t('results.antiScam.noOtp')}</li>
          <li>{t('results.antiScam.checkDomain')}</li>
        </ul>
      </section>
    </div>
  )
}
