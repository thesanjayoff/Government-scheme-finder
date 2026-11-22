import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

export function BottomNav() {
  const { t } = useI18n()
  const items = [
    { to: '/', icon: '🏠', labelKey: 'nav.home' },
    { to: '/results', icon: '📋', labelKey: 'nav.results' },
    { to: '/tracker', icon: '✅', labelKey: 'nav.tracker' },
    { to: '/help-centres', icon: '📍', labelKey: 'nav.helpCentres' },
    { to: '/scam-check', icon: '🛡️', labelKey: 'nav.scamCheck' },
  ]
  return (
    <nav className="bottom-nav" aria-label={t('nav.home')}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'}>
          <span aria-hidden="true" style={{ fontSize: '1.3rem' }}>
            {item.icon}
          </span>
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
