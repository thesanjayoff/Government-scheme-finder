import type { LocalizedText } from './localized'

export type QuestionValueType = 'number' | 'boolean' | 'enum' | 'multiEnum'

export type QuestionCategory =
  | 'identity' // age, gender, marital status
  | 'location' // state, district, area type
  | 'occupation'
  | 'economic' // income, land ownership
  | 'education'
  | 'household'
  | 'disability'
  | 'social-category' // caste category, religion -- sensitive
  | 'health'

export interface QuestionOption {
  value: string
  label: LocalizedText
}

export interface QuestionDef {
  id: string
  type: QuestionValueType
  category: QuestionCategory
  /** Sensitive questions are optional, explained, and skippable. */
  sensitive: boolean
  label: LocalizedText
  helpText?: LocalizedText
  /** Plain-language explanation of why we ask, shown next to sensitive questions. */
  whyWeAsk?: LocalizedText
  options?: QuestionOption[] // for enum / multiEnum
  min?: number // for number
  max?: number
  unit?: LocalizedText
  /** Which "subject" this question is about: the person, or the household as a whole. */
  subject: 'person' | 'household'
}

export type AnswerValue = number | boolean | string | string[]

/** Answers for a single person (or the household), keyed by question id. */
export type AnswerMap = Record<string, AnswerValue | undefined>
