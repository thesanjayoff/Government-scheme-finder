import { useState } from 'react'
import { useSession } from '../state/SessionProvider'
import { useI18n } from '../i18n'
import { Link } from 'react-router-dom'

export function HouseholdPage() {
  const { t } = useI18n()
  const { state, dispatch } = useSession()
  const [nickname, setNickname] = useState('')

  const handleAdd = () => {
    if (!nickname.trim()) return
    dispatch({ type: 'addMember', nickname: nickname.trim() })
    setNickname('')
  }

  return (
    <div className="page">
      <h1>{t('household.title')}</h1>
      <p className="muted">{t('household.sharedQuestions')}</p>

      <ul className="stack" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {state.household.members.map((m) => (
          <li key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{m.nickname}</span>
            <div className="stack" style={{ flexDirection: 'row' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'setActivePerson', personId: m.id })}
                aria-pressed={state.activePersonId === m.id}
              >
                {state.activePersonId === m.id ? '✓' : t('question.next')}
              </button>
              {m.id !== 'self' && (
                <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'removeMember', personId: m.id })}>
                  {t('household.removeMember')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="stack" style={{ flexDirection: 'row' }}>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('household.nicknamePlaceholder')}
          style={{ flex: 1, minHeight: 'var(--touch-target)', padding: '0.5em', borderRadius: 'var(--radius)', border: '2px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          {t('household.addMember')}
        </button>
      </div>

      <Link to="/question" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
        {t('question.next')}
      </Link>
    </div>
  )
}
