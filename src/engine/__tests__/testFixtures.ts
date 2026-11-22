import type { Scheme } from '../../types/scheme'
import type { Criterion } from '../../types/rules'

const lt: Criterion['explanation'] = { ta: 'விளக்கம்', en: 'explanation' }

export function makeScheme(overrides: Partial<Scheme> & Pick<Scheme, 'eligibilityCriteria'>): Scheme {
  return {
    id: 'test-scheme',
    name: { ta: 'சோதனைத் திட்டம்', en: 'Test Scheme' },
    authority: { ta: 'சோதனை', en: 'Test authority' },
    level: 'central',
    lifeAreas: ['education'],
    benefitSummary: { ta: 'பலன்', en: 'benefit' },
    description: { ta: 'விவரம்', en: 'description' },
    exclusions: [],
    requiredDocuments: [],
    applicationSteps: [{ step: 1, description: lt }],
    officialLinks: [{ url: 'https://gov.in/x', domain: 'gov.in', title: lt }],
    deadline: { type: 'rolling', description: lt },
    sources: [{ url: 'https://gov.in/x', domain: 'gov.in', title: lt }],
    lastVerified: '2026-11-22',
    reviewer: 'test',
    status: 'published',
    applicationEffort: 'low',
    benefitValue: 3,
    ...overrides,
  }
}
