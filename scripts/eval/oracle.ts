/**
 * Independent reference oracle for the evaluation harness.
 *
 * Each function here is a hand-written restatement of a scheme's published
 * eligibility rule, written directly as plain boolean/number logic -- NOT by
 * calling the engine's Condition/evaluateScheme machinery. The point is to
 * catch bugs in the engine (three-valued logic, near-miss thresholds, the
 * eligible/almost/not-eligible/unknown classification boundaries, the
 * question selector) by comparing its output against a differently-written
 * implementation of the same rule.
 *
 * Caveat (see README "Evaluation" section): both this oracle and the engine
 * were derived from the same scheme JSON files during initial development,
 * so this is a regression/implementation-bug check, not the independent
 * human (social worker / e-Sevai operator) verification the project plan
 * calls for. Treat "errors found here" as real engine bugs; treat "no
 * errors found" as "internally consistent", not "verified correct against
 * the law".
 */
import type { AnswerMap } from '../../src/types/questions'

export type OracleOutcome = 'eligible' | 'almost-eligible' | 'not-eligible' | 'unknown'
type State = 'pass' | 'fail' | 'near' | 'unknown'

function num(a: AnswerMap, field: string): number | undefined {
  const v = a[field]
  return typeof v === 'number' ? v : undefined
}

function eqS(value: unknown, expected: unknown): State {
  return value === undefined ? 'unknown' : value === expected ? 'pass' : 'fail'
}

function inS(value: unknown, allowed: unknown[]): State {
  return value === undefined ? 'unknown' : allowed.includes(value) ? 'pass' : 'fail'
}

function notInS(value: unknown, disallowed: unknown[]): State {
  return value === undefined ? 'unknown' : !disallowed.includes(value) ? 'pass' : 'fail'
}

/** gte/lte/between-style numeric criterion, with an optional near-miss margin. */
function numS(value: number | undefined, pass: (v: number) => boolean, margin: number | undefined, distance: (v: number) => number): State {
  if (value === undefined) return 'unknown'
  if (pass(value)) return 'pass'
  if (margin !== undefined && distance(value) <= margin) return 'near'
  return 'fail'
}

/** Three-valued OR: pass if any branch passes; fail only if every branch is known-false; otherwise unknown. */
function orS(...states: State[]): State {
  if (states.some((s) => s === 'pass')) return 'pass'
  if (states.every((s) => s === 'fail')) return 'fail'
  return 'unknown'
}

/** Three-valued AND: fail if any branch fails; pass only if every branch passes; otherwise unknown. */
function andS(...states: State[]): State {
  if (states.some((s) => s === 'fail')) return 'fail'
  if (states.every((s) => s === 'pass')) return 'pass'
  return 'unknown'
}

/** Mirrors the engine's eligible/almost-eligible/not-eligible/unknown classification exactly. */
function combine(states: State[], excluded: boolean): OracleOutcome {
  if (excluded) return 'not-eligible'
  if (states.some((s) => s === 'fail')) return 'not-eligible'
  const pending = states.filter((s) => s === 'near' || s === 'unknown').length
  if (pending === 0) return 'eligible'
  const matched = states.filter((s) => s === 'pass').length
  const nothingConfirmedYet = matched === 0 && states.every((s) => s === 'unknown')
  if (nothingConfirmedYet) return 'unknown'
  return pending <= 2 ? 'almost-eligible' : 'unknown'
}

type Oracle = (a: AnswerMap) => OracleOutcome

export const ORACLE: Record<string, Oracle> = {
  'pm-kisan': (a) => {
    const land = num(a, 'landOwnedAcres')
    const landState: State = land === undefined ? 'unknown' : land > 0 ? 'pass' : 'fail'
    return combine([landState], a.occupation === 'salaried-govt')
  },

  'tn-old-age-pension': (a) => {
    const age = num(a, 'age')
    const states = [numS(age, (v) => v >= 60, 3, (v) => 60 - v), inS(a.rationCardType, ['bpl', 'aay']), eqS(a.state, 'tamil-nadu')]
    return combine(states, ['widow-pension', 'disability-pension', 'other-pension'].includes(a.receivesPension as string))
  },

  nmmss: (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      eqS(a.currentlyStudying, true),
      inS(a.educationLevel, ['secondary', 'higher-secondary']),
      numS(income, (v) => v <= 350000, 50000, (v) => v - 350000),
    ]
    return combine(states, false)
  },

  'tn-pudhumai-penn': (a) => {
    const states = [eqS(a.gender, 'female'), eqS(a.state, 'tamil-nadu'), eqS(a.currentlyStudying, true), inS(a.educationLevel, ['undergraduate', 'iti-polytechnic'])]
    return combine(states, false)
  },

  'central-sector-college-scholarship': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      eqS(a.currentlyStudying, true),
      inS(a.educationLevel, ['undergraduate', 'postgraduate']),
      numS(income, (v) => v <= 450000, 50000, (v) => v - 450000),
    ]
    return combine(states, false)
  },

  'tn-post-matric-scholarship-sc-st': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      inS(a.socialCategory, ['sc', 'st']),
      eqS(a.state, 'tamil-nadu'),
      eqS(a.currentlyStudying, true),
      numS(income, (v) => v <= 250000, 25000, (v) => v - 250000),
    ]
    return combine(states, false)
  },

  'minority-post-matric-scholarship': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      eqS(a.religionMinority, true),
      eqS(a.currentlyStudying, true),
      inS(a.educationLevel, ['higher-secondary', 'iti-polytechnic', 'undergraduate', 'postgraduate', 'professional']),
      numS(income, (v) => v <= 200000, 20000, (v) => v - 200000),
    ]
    return combine(states, false)
  },

  'tn-adi-dravidar-tribal-welfare-hostel': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      inS(a.socialCategory, ['sc', 'st']),
      eqS(a.state, 'tamil-nadu'),
      eqS(a.currentlyStudying, true),
      numS(income, (v) => v <= 200000, 25000, (v) => v - 200000),
    ]
    return combine(states, false)
  },

  'aicte-pragati-saksham-scholarship': (a) => {
    const disability = num(a, 'disabilityPercentage')
    const disabledState: State = disability === undefined ? 'unknown' : disability >= 40 ? 'pass' : 'fail'
    const states = [eqS(a.currentlyStudying, true), inS(a.educationLevel, ['iti-polytechnic', 'undergraduate']), orS(eqS(a.gender, 'female'), disabledState)]
    return combine(states, false)
  },

  'national-family-benefit-scheme': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const branch1 = inS(a.rationCardType, ['bpl', 'aay'])
    const branch2 = andS(eqS(a.areaType, 'rural'), numS(income, (v) => v <= 46000, undefined, () => 0))
    const branch3 = andS(eqS(a.areaType, 'urban'), numS(income, (v) => v <= 56000, undefined, () => 0))
    return combine([orS(branch1, branch2, branch3)], false)
  },

  'pm-matru-vandana-yojana': (a) => {
    const age = num(a, 'age')
    const states = [eqS(a.gender, 'female'), numS(age, (v) => v >= 19, 1, (v) => 19 - v)]
    return combine(states, a.occupation === 'salaried-govt')
  },

  pmsby: (a) => {
    const age = num(a, 'age')
    const states = [numS(age, (v) => v >= 18 && v <= 70, 1, (v) => (v < 18 ? 18 - v : v - 70)), eqS(a.bankAccountExists, true)]
    return combine(states, false)
  },

  'pm-sym': (a) => {
    const age = num(a, 'age')
    const income = num(a, 'householdIncomeAnnual')
    const states = [
      numS(age, (v) => v >= 18 && v <= 40, 2, (v) => (v < 18 ? 18 - v : v - 40)),
      inS(a.occupation, ['agri-labourer', 'fisherperson', 'construction-worker', 'street-vendor', 'domestic-worker', 'unorganised-worker', 'self-employed']),
      numS(income, (v) => v <= 180000, 24000, (v) => v - 180000),
    ]
    return combine(states, false)
  },

  'tn-destitute-widow-pension': (a) => {
    const age = num(a, 'age')
    const states = [eqS(a.gender, 'female'), eqS(a.maritalStatus, 'widowed'), numS(age, (v) => v >= 30 && v <= 59, 3, (v) => (v < 30 ? 30 - v : v - 59)), eqS(a.state, 'tamil-nadu')]
    return combine(states, ['old-age-pension', 'disability-pension', 'other-pension'].includes(a.receivesPension as string))
  },

  'tn-moovalur-marriage-assistance': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [eqS(a.state, 'tamil-nadu'), eqS(a.gender, 'female'), eqS(a.maritalStatus, 'unmarried'), numS(income, (v) => v <= 72000, 8000, (v) => v - 72000)]
    return combine(states, false)
  },

  'tn-muthulakshmi-reddy-maternity-benefit': (a) => {
    const age = num(a, 'age')
    const states = [eqS(a.gender, 'female'), numS(age, (v) => v >= 19, 1, (v) => 19 - v), eqS(a.state, 'tamil-nadu')]
    return combine(states, a.occupation === 'salaried-govt')
  },

  'ab-pmjay': (a) => {
    const states = [orS(inS(a.rationCardType, ['bpl', 'aay']), inS(a.houseOwnership, ['own-kutcha', 'homeless']))]
    return combine(states, a.occupation === 'salaried-govt')
  },

  'adip-assistive-devices': (a) => {
    const disability = num(a, 'disabilityPercentage')
    const income = num(a, 'householdIncomeAnnual')
    const states = [numS(disability, (v) => v >= 40, 5, (v) => 40 - v), numS(income, (v) => v <= 360000, 60000, (v) => v - 360000)]
    return combine(states, false)
  },

  'pmay-gramin': (a) => {
    const states = [eqS(a.areaType, 'rural'), inS(a.houseOwnership, ['own-kutcha', 'homeless'])]
    return combine(states, a.occupation === 'salaried-govt')
  },

  'pmay-urban': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [eqS(a.areaType, 'urban'), inS(a.houseOwnership, ['own-kutcha', 'rented', 'homeless']), numS(income, (v) => v <= 900000, 50000, (v) => v - 900000)]
    return combine(states, false)
  },

  'pmfby-crop-insurance': (a) => combine([eqS(a.occupation, 'farmer')], false),

  'kisan-credit-card': (a) => {
    const states = [inS(a.occupation, ['farmer', 'agri-labourer', 'fisherperson']), eqS(a.bankAccountExists, true)]
    return combine(states, false)
  },

  'tn-disability-pension': (a) => {
    const disability = num(a, 'disabilityPercentage')
    const age = num(a, 'age')
    const states = [numS(disability, (v) => v >= 40, 5, (v) => 40 - v), numS(age, (v) => v >= 18, undefined, () => 0), eqS(a.state, 'tamil-nadu')]
    return combine(states, ['old-age-pension', 'widow-pension', 'other-pension'].includes(a.receivesPension as string))
  },

  'tn-vetri-veedu-thittam': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [eqS(a.state, 'tamil-nadu'), eqS(a.areaType, 'rural'), eqS(a.houseOwnership, 'own-kutcha'), numS(income, (v) => v <= 250000, 25000, (v) => v - 250000)]
    return combine(states, false)
  },

  'atal-pension-yojana': (a) => {
    const age = num(a, 'age')
    const states = [numS(age, (v) => v >= 18 && v <= 40, 2, (v) => (v < 18 ? 18 - v : v - 40)), eqS(a.bankAccountExists, true)]
    return combine(states, a.occupation === 'salaried-govt')
  },

  pmegp: (a) => {
    const age = num(a, 'age')
    return combine([numS(age, (v) => v >= 18, undefined, () => 0)], false)
  },

  'pm-svanidhi': (a) => combine([eqS(a.occupation, 'street-vendor'), eqS(a.areaType, 'urban')], false),

  'tn-cmchis': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [eqS(a.state, 'tamil-nadu'), numS(income, (v) => v <= 120000, 20000, (v) => v - 120000), notInS(a.rationCardType, ['none'])]
    return combine(states, false)
  },

  'tn-construction-workers-welfare': (a) => {
    const states = [eqS(a.occupation, 'construction-worker'), eqS(a.state, 'tamil-nadu'), eqS(a.employmentRegistered, true)]
    return combine(states, false)
  },

  'tn-evr-maniammaiyar-marriage-assistance': (a) => {
    const income = num(a, 'householdIncomeAnnual')
    const states = [eqS(a.gender, 'female'), eqS(a.maritalStatus, 'unmarried'), numS(income, (v) => v <= 120000, 15000, (v) => v - 120000), eqS(a.state, 'tamil-nadu')]
    return combine(states, false)
  },

  'tn-marriage-assistance-differently-abled': (a) => {
    const disability = num(a, 'disabilityPercentage')
    const age = num(a, 'age')
    const states = [numS(disability, (v) => v >= 40, 5, (v) => 40 - v), eqS(a.maritalStatus, 'unmarried'), numS(age, (v) => v >= 18, undefined, () => 0), eqS(a.state, 'tamil-nadu')]
    return combine(states, false)
  },
}
