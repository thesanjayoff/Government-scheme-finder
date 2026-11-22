import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import en from './en.json'
import ta from './ta.json'
import { APP_CONFIG, type SupportedLocale } from '../config/appConfig'

const DICTIONARIES: Record<SupportedLocale, unknown> = { en, ta }
const STORAGE_KEY = 'tt.locale'

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key]
    return value !== undefined ? String(value) : match
  })
}

function loadStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && APP_CONFIG.supportedLocales.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale
    }
  } catch {
    // localStorage unavailable (private mode etc.) -- fall through to default.
  }
  return APP_CONFIG.defaultLocale
}

interface I18nContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(loadStoredLocale)

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage failures
    }
    document.documentElement.lang = next
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[locale]
      const value = getPath(dict, key)
      if (typeof value === 'string') return interpolate(value, vars)
      const fallback = getPath(DICTIONARIES.en, key)
      if (typeof fallback === 'string') return interpolate(fallback, vars)
      return key
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Picks the right language out of a LocalizedText object for the active locale. */
export function useLocalized() {
  const { locale } = useI18n()
  return useCallback(
    (text: { ta: string; en: string }) => text[locale] ?? text.en,
    [locale],
  )
}
