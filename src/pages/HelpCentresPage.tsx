import helpCentresData from '../data/helpCentres.json'
import { useI18n, useLocalized } from '../i18n'

interface HelpCentre {
  id: string
  name: { ta: string; en: string }
  type: string
  description: { ta: string; en: string }
  contact: string | null
  hours: { ta: string; en: string } | null
  source: { url: string; domain: string }
  lastVerified: string
}

const helpCentres = helpCentresData as HelpCentre[]

export function HelpCentresPage() {
  const { t } = useI18n()
  const localize = useLocalized()

  return (
    <div className="page">
      <h1>{t('helpCentres.title')}</h1>
      <p className="muted">
        A verified, hand-maintained list -- not scraped or guessed. If a number stops working, please tell us so we can
        re-check it.
      </p>

      {helpCentres.map((centre) => (
        <div key={centre.id} className="card">
          <h3>{localize(centre.name)}</h3>
          <p>{localize(centre.description)}</p>
          {centre.contact && (
            <p>
              <a href={`tel:${centre.contact.replace(/[^0-9+]/g, '')}`}>{centre.contact}</a>
            </p>
          )}
          {centre.hours && <p className="muted">{localize(centre.hours)}</p>}
          <p className="muted">
            <a href={centre.source.url} target="_blank" rel="noopener noreferrer">
              {centre.source.domain}
            </a>{' '}
            -- {t('results.lastVerified', { date: centre.lastVerified })}
          </p>
        </div>
      ))}
    </div>
  )
}
