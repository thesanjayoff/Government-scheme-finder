import { useI18n, useLocalized } from '../i18n'
import { useSession } from '../state/SessionProvider'
import { SCHEMES } from '../data/loadSchemes'
import type { TrackerStatus } from '../state/types'

const STATUS_OPTIONS: TrackerStatus[] = ['not-started', 'in-progress', 'submitted', 'approved', 'rejected']

export function TrackerPage() {
  const { t } = useI18n()
  const localize = useLocalized()
  const { state, setTrackerStatus } = useSession()

  const entries = state.trackerEntries.filter((e) => e.status !== 'not-started')

  return (
    <div className="page">
      <h1>{t('nav.tracker')}</h1>
      <p className="muted">{t('privacy.body')}</p>

      {entries.length === 0 && <p className="card">{t('results.noResults')}</p>}

      {entries.map((entry) => {
        const scheme = SCHEMES.find((s) => s.id === entry.schemeId)
        const person = state.household.members.find((m) => m.id === entry.personId)
        if (!scheme) return null
        return (
          <div key={`${entry.schemeId}-${entry.personId}`} className="card">
            <h3>{localize(scheme.name)}</h3>
            <p className="muted">{person?.nickname}</p>
            <label>
              Status:
              <select
                value={entry.status}
                onChange={(e) => setTrackerStatus(entry.schemeId, entry.personId, e.target.value as TrackerStatus, entry.notes)}
                style={{ marginLeft: '0.5rem', minHeight: 'var(--touch-target)' }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">Last updated: {entry.date}</p>
            <textarea
              defaultValue={entry.notes}
              placeholder="Notes"
              onBlur={(e) => setTrackerStatus(entry.schemeId, entry.personId, entry.status, e.target.value)}
              style={{ width: '100%', minHeight: '4rem', marginTop: '0.5rem', borderRadius: 'var(--radius)', border: '2px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        )
      })}
    </div>
  )
}
