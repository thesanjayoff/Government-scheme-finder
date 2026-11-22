import { z } from 'zod'

const localizedText = z.object({ ta: z.string().min(1), en: z.string().min(1) })

const answerValue = z.union([z.number(), z.boolean(), z.string(), z.array(z.string())])

// Recursive Condition schema.
const condition: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.object({ op: z.literal('eq'), field: z.string(), value: answerValue }),
    z.object({ op: z.literal('neq'), field: z.string(), value: answerValue }),
    z.object({ op: z.literal('gte'), field: z.string(), value: z.number() }),
    z.object({ op: z.literal('lte'), field: z.string(), value: z.number() }),
    z.object({ op: z.literal('gt'), field: z.string(), value: z.number() }),
    z.object({ op: z.literal('lt'), field: z.string(), value: z.number() }),
    z.object({ op: z.literal('between'), field: z.string(), min: z.number(), max: z.number() }),
    z.object({ op: z.literal('in'), field: z.string(), values: z.array(answerValue) }),
    z.object({ op: z.literal('notIn'), field: z.string(), values: z.array(answerValue) }),
    z.object({ op: z.literal('includesAny'), field: z.string(), values: z.array(z.string()) }),
    z.object({ op: z.literal('exists'), field: z.string() }),
    z.object({ op: z.literal('and'), conditions: z.array(condition) }),
    z.object({ op: z.literal('or'), conditions: z.array(condition) }),
    z.object({ op: z.literal('not'), condition }),
  ]),
)

const criterion = z.object({
  id: z.string().min(1),
  condition,
  explanation: localizedText,
  nearMissMargin: z.number().optional(),
  nearMissGuidance: localizedText.optional(),
})

const schemeSource = z.object({
  url: z.string().url(),
  domain: z.string().min(1),
  title: localizedText,
})

const requiredDocument = z.object({
  id: z.string().min(1),
  name: localizedText,
  description: localizedText,
  howToGet: localizedText,
})

const applicationStep = z.object({
  step: z.number().int().positive(),
  description: localizedText,
})

const deadlineInfo = z.object({
  type: z.enum(['rolling', 'annual-cycle', 'fixed-date']),
  description: localizedText,
  date: z.string().optional(),
  cycleNote: localizedText.optional(),
})

export const schemeSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  name: localizedText,
  authority: localizedText,
  level: z.enum(['central', 'state']),
  lifeAreas: z
    .array(
      z.enum([
        'education',
        'farmers',
        'women-family',
        'seniors-widows',
        'disability',
        'workers-employment',
        'health-insurance',
        'housing',
      ]),
    )
    .min(1),
  benefitSummary: localizedText,
  description: localizedText,
  eligibilityCriteria: z.array(criterion).min(1),
  exclusions: z.array(criterion),
  requiredDocuments: z.array(requiredDocument),
  applicationSteps: z.array(applicationStep).min(1),
  officialLinks: z.array(schemeSource).min(1),
  deadline: deadlineInfo,
  sources: z.array(schemeSource).min(1),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'lastVerified must be YYYY-MM-DD'),
  reviewer: z.string().min(1),
  status: z.enum(['published', 'needs-review', 'draft']),
  applicationEffort: z.enum(['low', 'medium', 'high']),
  benefitValue: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
})

export type SchemeInput = z.infer<typeof schemeSchema>
