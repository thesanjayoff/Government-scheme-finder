import type { LocalizedText } from './localized'
import type { Criterion } from './rules'

export type AuthorityLevel = 'central' | 'state'

export type LifeArea =
  | 'education'
  | 'farmers'
  | 'women-family'
  | 'seniors-widows'
  | 'disability'
  | 'workers-employment'
  | 'health-insurance'
  | 'housing'

export interface SchemeSource {
  url: string
  /** Domain extracted from url, used for the official-domain allow-list check. */
  domain: string
  title: LocalizedText
}

export interface RequiredDocument {
  id: string
  name: LocalizedText
  description: LocalizedText
  /** Where/how to obtain it, in simple language. */
  howToGet: LocalizedText
}

export interface ApplicationStep {
  step: number
  description: LocalizedText
}

export interface DeadlineInfo {
  type: 'rolling' | 'annual-cycle' | 'fixed-date'
  description: LocalizedText
  /** ISO date, only for type === 'fixed-date'. */
  date?: string
  /** e.g. "every year in July" for annual-cycle. */
  cycleNote?: LocalizedText
}

export interface Scheme {
  id: string
  name: LocalizedText
  authority: LocalizedText
  level: AuthorityLevel
  lifeAreas: LifeArea[]
  benefitSummary: LocalizedText
  /** Longer, plain-language description. */
  description: LocalizedText
  eligibilityCriteria: Criterion[]
  exclusions: Criterion[]
  requiredDocuments: RequiredDocument[]
  applicationSteps: ApplicationStep[]
  officialLinks: SchemeSource[]
  deadline: DeadlineInfo
  sources: SchemeSource[]
  lastVerified: string // ISO date
  reviewer: string
  /** Only "published" schemes are shown to end users. */
  status: 'published' | 'needs-review' | 'draft'
  /** Rough effort to apply, used for ranking ("highest value first" etc.) */
  applicationEffort: 'low' | 'medium' | 'high'
  /** Relative benefit value used for ranking; not a currency amount. 1-5. */
  benefitValue: 1 | 2 | 3 | 4 | 5
}
