import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { APP_CONFIG } from '../config/appConfig'
import { useSession } from '../state/SessionProvider'

export function HomePage() {
  const { t, locale } = useI18n()
  const { state } = useSession()
  const hasStarted = Object.keys(state.household.sharedAnswers).length > 0 || state.household.members.some((m) => Object.keys(m.answers).length > 0)

  return (
    <div className="page">
      <h1>{locale === 'ta' ? APP_CONFIG.appNameTa : APP_CONFIG.appName}</h1>
      <p>{t('app.tagline')}</p>
      <p>{t('home.intro')}</p>

      <div className="disclaimer-box" style={{ marginBottom: '1.5rem' }}>
        {t('home.disclaimerShort')}
      </div>

      <div className="stack">
        <Link to="/question" className="btn btn-primary btn-block">
          {hasStarted ? t('home.continueLast') : t('home.startButton')}
        </Link>
        <Link to="/household" className="btn btn-secondary btn-block">
          {t('home.householdModeButton')}
        </Link>
        <Link to="/assisted" className="btn btn-secondary btn-block">
          {t('home.assistedModeButton')}
        </Link>
        <Link to="/privacy" className="btn btn-ghost btn-block">
          {t('nav.privacy')}
        </Link>
      </div>
    </div>
  )
}
