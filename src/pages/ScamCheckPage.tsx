import { useState } from 'react'
import { useI18n, useLocalized } from '../i18n'
import { checkTextForScams, type ScamCheckResult } from '../engine/scamCheck'

export function ScamCheckPage() {
  const { t } = useI18n()
  const localize = useLocalized()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ScamCheckResult | null>(null)

  return (
    <div className="page">
      <h1>{t('scamCheck.title')}</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('scamCheck.placeholder')}
        style={{ width: '100%', minHeight: '6rem', padding: '0.75em', borderRadius: 'var(--radius)', border: '2px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
      />
      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} onClick={() => setResult(checkTextForScams(text))}>
        {t('scamCheck.checkButton')}
      </button>

      {result && (
        <div className="card" style={{ marginTop: '1rem' }}>
          {result.isOfficial === true && <p className="badge badge-eligible">{t('scamCheck.officialVerdict')}</p>}
          {result.isOfficial === false && <p className="badge badge-danger">{t('scamCheck.notOfficialVerdict')}</p>}
          {result.domain && <p className="muted">Domain: {result.domain}</p>}

          {result.matchedPatterns.length > 0 && (
            <ul>
              {result.matchedPatterns.map((p) => (
                <li key={p.id}>{t('scamCheck.scamPatternFound', { pattern: localize(p.label) })}</li>
              ))}
            </ul>
          )}

          <p className="disclaimer-box">{t('scamCheck.caveat')}</p>
        </div>
      )}
    </div>
  )
}
