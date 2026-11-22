import { APP_CONFIG } from '../config/appConfig'
import { useI18n } from '../i18n'

export function TopBar() {
  const { locale, setLocale, t } = useI18n()
  return (
    <header className="top-bar">
      <strong>{locale === 'ta' ? APP_CONFIG.appNameTa : APP_CONFIG.appName}</strong>
      <div className="lang-switch" role="group" aria-label={t('settings')}>
        <button type="button" aria-pressed={locale === 'ta'} onClick={() => setLocale('ta')} lang="ta">
          த
        </button>
        <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')} lang="en">
          En
        </button>
      </div>
    </header>
  )
}
