import { useState } from 'react'
import type { SchemeEvaluation } from '../engine/ruleEvaluator'
import { getNearMissGuidance } from '../engine/ruleEvaluator'
import { isStale } from '../engine/ranking'
import { isOfficialDomain } from '../data/domainAllowList'
import { useI18n, useLocalized } from '../i18n'
import { useSession } from '../state/SessionProvider'

const OUTCOME_BADGE: Record<SchemeEvaluation['outcome'], { className: string; key: string }> = {
  eligible: { className: 'badge-eligible', key: 'results.eligible' },
  'almost-eligible': { className: 'badge-almost', key: 'results.almostEligible' },
  unknown: { className: 'badge-unknown', key: 'results.unknown' },
  'not-eligible': { className: 'badge-danger', key: 'results.unknown' },
}

export function SchemeCard({ evaluation, personId }: { evaluation: SchemeEvaluation; personId: string }) {
  const { t, locale } = useI18n()
  const localize = useLocalized()
  const { state, dispatch, setTrackerStatus } = useSession()
  const [expanded, setExpanded] = useState(false)
  const { scheme, outcome } = evaluation
  const badge = OUTCOME_BADGE[outcome]
  const stale = isStale(scheme.lastVerified)
  const nearMiss = getNearMissGuidance(evaluation)
  const isDraft = scheme.status !== 'published'

  const tracked = state.trackerEntries.find((e) => e.schemeId === scheme.id && e.personId === personId)

  const handleShare = async () => {
    const link = scheme.officialLinks[0]
    const text = `${localize(scheme.name)} -- ${localize(scheme.benefitSummary)}\n${link?.url ?? ''}`
    if (navigator.share) {
      try {
        await navigator.share({ title: localize(scheme.name), text, url: link?.url })
      } catch {
        // user cancelled share -- not an error
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <article className="card">
      <div className="stack" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span className={`badge ${badge.className}`}>{t(badge.key)}</span>
        {isDraft && <span className="draft-flag" title="Draft, pending human review">DRAFT</span>}
      </div>

      <h3>{localize(scheme.name)}</h3>
      <p className="muted">{localize(scheme.authority)}</p>
      <p>{localize(scheme.benefitSummary)}</p>

      {stale && <p className="disclaimer-box">{t('results.staleWarning')}</p>}

      <div className="stack" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? t('common.close') : t('results.whyYouMatch')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleShare}>
          {t('results.share')}
        </button>
      </div>

      {expanded && (
        <div className="stack" style={{ marginTop: '1rem' }}>
          <section>
            <h4>{t('results.whyYouMatch')}</h4>
            <ul>
              {evaluation.matchedCriteria.map((c) => (
                <li key={c.criterion.id}>{localize(c.criterion.explanation)}</li>
              ))}
              {evaluation.matchedCriteria.length === 0 && <li className="muted">{t('results.unknown')}</li>}
            </ul>
          </section>

          {nearMiss.length > 0 && (
            <section>
              <h4>{t('results.nearMissGuidance')}</h4>
              <ul>
                {nearMiss.map((g) => (
                  <li key={g.criterionId}>{localize(g.guidance)}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4>{t('results.documentsNeeded')}</h4>
            <ul className="stack" style={{ listStyle: 'none', paddingLeft: 0 }}>
              {scheme.requiredDocuments.map((doc) => {
                const have = state.haveDocuments.includes(doc.id)
                return (
                  <li key={doc.id}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={have}
                        onChange={() => dispatch({ type: 'toggleHaveDocument', documentId: doc.id })}
                        style={{ width: 24, height: 24, marginTop: 2 }}
                      />
                      <span>
                        <strong>{localize(doc.name)}</strong> -- {localize(doc.description)}
                        <br />
                        <span className="muted">{localize(doc.howToGet)}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h4>{t('results.applicationSteps')}</h4>
            <ol>
              {scheme.applicationSteps.map((step) => (
                <li key={step.step}>{localize(step.description)}</li>
              ))}
            </ol>
          </section>

          <section>
            <h4>{t('results.officialLink')}</h4>
            {scheme.officialLinks.map((link) => {
              const official = isOfficialDomain(link.url)
              return (
                <p key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {localize(link.title)}
                  </a>{' '}
                  {official ? (
                    <span className="badge badge-eligible">{t('results.officialBadge')}</span>
                  ) : (
                    <span className="badge badge-danger">{t('results.nonOfficialWarning')}</span>
                  )}
                </p>
              )
            })}
            <p className="muted">{localize(scheme.deadline.description)}</p>
            <p className="muted">{t('results.lastVerified', { date: scheme.lastVerified })}</p>
          </section>

          <section>
            <h4>{t('nav.tracker')}</h4>
            <select
              value={tracked?.status ?? 'not-started'}
              onChange={(e) => setTrackerStatus(scheme.id, personId, e.target.value as never)}
              style={{ minHeight: 'var(--touch-target)', padding: '0.5em', borderRadius: 'var(--radius)' }}
            >
              <option value="not-started">{t('results.addToTracker')}</option>
              <option value="in-progress">In progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </section>
        </div>
      )}
      <span className="sr-only">{locale}</span>
    </article>
  )
}
