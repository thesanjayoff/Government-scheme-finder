/* eslint-disable no-console */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { schemeSchema } from '../src/data/schemeSchema'
import { QUESTION_BY_ID } from '../src/data/questions'
import { isOfficialDomain } from '../src/data/domainAllowList'
import { collectFields } from '../src/engine/ruleEvaluator'
import type { Condition, Criterion } from '../src/types/rules'
import type { Scheme } from '../src/types/scheme'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMES_DIR = join(__dirname, '..', 'src', 'data', 'schemes')
const STALE_AFTER_DAYS = 180
const CHECK_LINKS = process.argv.includes('--check-links')

interface Problem {
  schemeId: string
  level: 'error' | 'warning'
  message: string
}

const problems: Problem[] = []

function err(schemeId: string, message: string) {
  problems.push({ schemeId, level: 'error', message })
}
function warn(schemeId: string, message: string) {
  problems.push({ schemeId, level: 'warning', message })
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
}

/** Flags same-field `eq` criteria (ANDed together at top level) that require contradictory values. */
function checkContradictions(schemeId: string, criteria: Criterion[]) {
  const eqByField = new Map<string, Set<string>>()
  for (const c of criteria) {
    if (c.condition.op === 'eq') {
      const key = c.condition.field
      const set = eqByField.get(key) ?? new Set<string>()
      set.add(JSON.stringify(c.condition.value))
      eqByField.set(key, set)
    }
  }
  for (const [field, values] of eqByField) {
    if (values.size > 1) {
      err(
        schemeId,
        `contradictory rules: field "${field}" has multiple required equal values at the top level: ${[...values].join(', ')}`,
      )
    }
  }
}

function checkFieldsExist(schemeId: string, label: string, criteria: Criterion[]) {
  for (const c of criteria) {
    const fields = collectFields(c.condition as Condition)
    for (const field of fields) {
      if (!QUESTION_BY_ID[field]) {
        err(schemeId, `${label} "${c.id}" references unknown question field "${field}"`)
      }
    }
  }
}

async function checkLinkReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    if (res.ok) return true
    // Some gov sites don't support HEAD -- retry with GET.
    const res2 = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) })
    return res2.ok
  } catch {
    return false
  }
}

async function main() {
  const files = readdirSync(SCHEMES_DIR).filter((f) => f.endsWith('.json'))
  if (files.length === 0) {
    console.error(`No scheme files found in ${SCHEMES_DIR}`)
    process.exit(1)
  }

  const ids = new Set<string>()
  const schemes: Scheme[] = []

  for (const file of files) {
    const raw = readFileSync(join(SCHEMES_DIR, file), 'utf-8')
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (e) {
      err(file, `invalid JSON: ${(e as Error).message}`)
      continue
    }

    const parsed = schemeSchema.safeParse(json)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        err(file, `schema error at ${issue.path.join('.')}: ${issue.message}`)
      }
      continue
    }

    const scheme = parsed.data as Scheme
    const schemeId = scheme.id

    if (ids.has(schemeId)) err(schemeId, `duplicate scheme id (also used by another file)`)
    ids.add(schemeId)

    if (file !== `${schemeId}.json`) {
      warn(schemeId, `file name "${file}" does not match scheme id "${schemeId}.json"`)
    }

    checkFieldsExist(schemeId, 'eligibility criterion', scheme.eligibilityCriteria)
    checkFieldsExist(schemeId, 'exclusion', scheme.exclusions)
    checkContradictions(schemeId, scheme.eligibilityCriteria)

    for (const link of scheme.officialLinks) {
      if (!isOfficialDomain(link.url)) {
        err(schemeId, `officialLinks contains a non-allow-listed domain: ${link.url}`)
      }
    }
    for (const source of scheme.sources) {
      if (!isOfficialDomain(source.url)) {
        warn(schemeId, `source is not on the official domain allow-list: ${source.url}`)
      }
    }

    if (daysSince(scheme.lastVerified) > STALE_AFTER_DAYS) {
      warn(
        schemeId,
        `lastVerified (${scheme.lastVerified}) is more than ${STALE_AFTER_DAYS} days old -- needs re-review`,
      )
    }

    if (scheme.status !== 'published') {
      warn(schemeId, `status is "${scheme.status}" -- will not be shown to end users until published`)
    }

    schemes.push(scheme)
  }

  if (CHECK_LINKS) {
    console.log('Checking link reachability (network required)...')
    for (const scheme of schemes) {
      for (const link of [...scheme.officialLinks, ...scheme.sources]) {
        const ok = await checkLinkReachable(link.url)
        if (!ok) warn(scheme.id, `link may be unreachable: ${link.url}`)
      }
    }
  }

  const errors = problems.filter((p) => p.level === 'error')
  const warnings = problems.filter((p) => p.level === 'warning')

  console.log(`\nValidated ${files.length} scheme file(s).\n`)

  if (warnings.length) {
    console.log(`--- Needs-review report (${warnings.length}) ---`)
    for (const w of warnings) console.log(`  [warn] ${w.schemeId}: ${w.message}`)
  }
  if (errors.length) {
    console.log(`\n--- Errors (${errors.length}) ---`)
    for (const e of errors) console.log(`  [error] ${e.schemeId}: ${e.message}`)
    console.log(`\nFAILED: ${errors.length} error(s).`)
    process.exit(1)
  }

  console.log('\nOK: no blocking errors.')
}

main()
