// Single source of truth for the product name, so the app can be re-branded
// by changing this file alone.
export const APP_CONFIG = {
  appName: 'Thagaval Thunai',
  appNameTa: 'தகவல் துணை',
  tagline: {
    en: 'Find government schemes you may be eligible for',
    ta: 'நீங்கள் தகுதி பெறக்கூடிய அரசு திட்டங்களை கண்டறியவும்',
  },
  defaultLocale: 'ta' as const,
  supportedLocales: ['ta', 'en'] as const,
  staleAfterDays: 180,
} as const

export type SupportedLocale = (typeof APP_CONFIG.supportedLocales)[number]
