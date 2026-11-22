import type { Scheme } from '../types/scheme'

// Vite bundles every scheme JSON at build time -- no network fetch at runtime.
// Schema validation (zod) runs in `npm run validate-data` and in CI, not here,
// so the shipped client bundle stays small and fast on low-end phones. Any
// file that fails validation is kept out of the build by that check, not by
// a runtime guard.
const modules = import.meta.glob('./schemes/*.json', { eager: true })

const allSchemes: Scheme[] = Object.values(modules).map((mod) => (mod as { default: Scheme }).default)

/**
 * Only "published" schemes (human-verified) are shown in production.
 * Setting VITE_SHOW_UNREVIEWED=true also surfaces "needs-review" drafts,
 * each visibly flagged in the UI, for local development/demo purposes only.
 */
const SHOW_UNREVIEWED = import.meta.env.VITE_SHOW_UNREVIEWED === 'true'

export const SCHEMES: Scheme[] = allSchemes.filter(
  (s) => s.status === 'published' || (SHOW_UNREVIEWED && s.status === 'needs-review'),
)

export const ALL_SCHEMES_INCLUDING_DRAFTS: Scheme[] = allSchemes
