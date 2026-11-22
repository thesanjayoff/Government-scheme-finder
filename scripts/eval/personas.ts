import type { AnswerMap } from '../../src/types/questions'

export interface Persona {
  id: string
  description: string
  answers: AnswerMap
}

/**
 * Synthetic test personas, including deliberate boundary cases (age exactly
 * at a threshold, income exactly at a ceiling) per the project's testing
 * requirements. These are AI-authored for engine regression testing; see
 * README "Evaluation" for why they are not a substitute for the human
 * (social worker / e-Sevai operator) verified test set the project plan
 * calls for.
 */
export const PERSONAS: Persona[] = [
  // --- Farmers / PM-KISAN ---
  { id: 'f01', description: 'TN farmer, 2 acres, self-employed', answers: { landOwnedAcres: 2, occupation: 'farmer', state: 'tamil-nadu' } },
  { id: 'f02', description: 'Landless agricultural labourer', answers: { landOwnedAcres: 0, occupation: 'agri-labourer', state: 'tamil-nadu' } },
  { id: 'f03', description: 'Govt employee who also owns land', answers: { landOwnedAcres: 3, occupation: 'salaried-govt', state: 'tamil-nadu' } },
  { id: 'f04', description: 'Farmer, land ownership unknown/unanswered', answers: { occupation: 'farmer', state: 'tamil-nadu' } },
  { id: 'f05', description: 'Farmer with exactly 0.1 acre (boundary above zero)', answers: { landOwnedAcres: 0.1, occupation: 'farmer', state: 'tamil-nadu' } },

  // --- Seniors / old-age pension ---
  { id: 's01', description: 'Destitute BPL elder, exactly 60, TN', answers: { age: 60, rationCardType: 'bpl', state: 'tamil-nadu', gender: 'male', maritalStatus: 'married' } },
  { id: 's02', description: 'BPL elder, 59 (one year short, within margin)', answers: { age: 59, rationCardType: 'bpl', state: 'tamil-nadu', gender: 'female', maritalStatus: 'widowed' } },
  { id: 's03', description: 'BPL elder, 55 (far short, outside margin)', answers: { age: 55, rationCardType: 'bpl', state: 'tamil-nadu' } },
  { id: 's04', description: 'APL (not poor) elder, 70, TN', answers: { age: 70, rationCardType: 'apl', state: 'tamil-nadu' } },
  { id: 's05', description: 'BPL elder, 65, other state (not TN)', answers: { age: 65, rationCardType: 'bpl', state: 'other' } },
  { id: 's06', description: 'AAY elder, 80, TN, already on widow pension (exclusion)', answers: { age: 80, rationCardType: 'aay', state: 'tamil-nadu', receivesPension: 'widow-pension' } },
  { id: 's07', description: 'Elder, age unknown, BPL, TN', answers: { rationCardType: 'bpl', state: 'tamil-nadu' } },

  // --- Students / scholarships ---
  { id: 'e01', description: 'School student, class 10, poor household, income 300000', answers: { currentlyStudying: true, educationLevel: 'secondary', householdIncomeAnnual: 300000 } },
  { id: 'e02', description: 'School student, class 10, income exactly 350000 (ceiling)', answers: { currentlyStudying: true, educationLevel: 'secondary', householdIncomeAnnual: 350000 } },
  { id: 'e03', description: 'School student, income 380000 (near-miss, within 50k margin)', answers: { currentlyStudying: true, educationLevel: 'secondary', householdIncomeAnnual: 380000 } },
  { id: 'e04', description: 'School student, income 500000 (hard fail, outside margin)', answers: { currentlyStudying: true, educationLevel: 'secondary', householdIncomeAnnual: 500000 } },
  { id: 'e05', description: 'College undergrad, not currently studying flag false (contradiction case)', answers: { currentlyStudying: false, educationLevel: 'undergraduate', householdIncomeAnnual: 200000 } },
  { id: 'e06', description: 'TN girl, undergrad, studying, no income given', answers: { gender: 'female', state: 'tamil-nadu', currentlyStudying: true, educationLevel: 'undergraduate' } },
  { id: 'e07', description: 'TN boy, undergrad, studying (Pudhumai Penn is girls-only)', answers: { gender: 'male', state: 'tamil-nadu', currentlyStudying: true, educationLevel: 'undergraduate' } },
  { id: 'e08', description: 'UG student, income exactly 450000 (CSSS ceiling)', answers: { currentlyStudying: true, educationLevel: 'undergraduate', householdIncomeAnnual: 450000 } },
  { id: 'e09', description: 'PG student, income 495000 (near-miss within 50k)', answers: { currentlyStudying: true, educationLevel: 'postgraduate', householdIncomeAnnual: 495000 } },
  { id: 'e10', description: 'SC student, TN, studying, income 240000', answers: { socialCategory: 'sc', state: 'tamil-nadu', currentlyStudying: true, householdIncomeAnnual: 240000 } },
  { id: 'e11', description: 'ST student, TN, studying, income exactly 250000 (ceiling)', answers: { socialCategory: 'st', state: 'tamil-nadu', currentlyStudying: true, householdIncomeAnnual: 250000 } },
  { id: 'e12', description: 'General-category student, TN, studying, low income (SC/ST schemes should not match)', answers: { socialCategory: 'general', state: 'tamil-nadu', currentlyStudying: true, householdIncomeAnnual: 100000 } },
  { id: 'e13', description: 'Minority student, higher secondary, income 180000', answers: { religionMinority: true, currentlyStudying: true, educationLevel: 'higher-secondary', householdIncomeAnnual: 180000 } },
  { id: 'e14', description: 'Non-minority student, otherwise identical to e13', answers: { religionMinority: false, currentlyStudying: true, educationLevel: 'higher-secondary', householdIncomeAnnual: 180000 } },
  { id: 'e15', description: 'SC/ST TN student needing hostel, income 190000', answers: { socialCategory: 'sc', state: 'tamil-nadu', currentlyStudying: true, householdIncomeAnnual: 190000 } },
  { id: 'e16', description: 'Girl, ITI student (AICTE Pragati)', answers: { gender: 'female', currentlyStudying: true, educationLevel: 'iti-polytechnic' } },
  { id: 'e17', description: 'Male UG student with 45% disability (AICTE Saksham)', answers: { gender: 'male', currentlyStudying: true, educationLevel: 'undergraduate', disabilityPercentage: 45 } },
  { id: 'e18', description: 'Able-bodied male UG student (should not match AICTE Pragati/Saksham)', answers: { gender: 'male', currentlyStudying: true, educationLevel: 'undergraduate', disabilityPercentage: 0 } },
  { id: 'e19', description: 'Male UG student, gender/disability both unanswered', answers: { currentlyStudying: true, educationLevel: 'undergraduate' } },

  // --- Women & family ---
  { id: 'w01', description: 'Pregnant woman, exactly 19', answers: { gender: 'female', age: 19, occupation: 'homemaker' } },
  { id: 'w02', description: 'Woman, 18 (one year short, within 1-year margin)', answers: { gender: 'female', age: 18, occupation: 'homemaker' } },
  { id: 'w03', description: 'Woman, 15 (far short)', answers: { gender: 'female', age: 15 } },
  { id: 'w04', description: 'Govt-salaried pregnant woman (excluded from PMMVY)', answers: { gender: 'female', age: 25, occupation: 'salaried-govt' } },
  { id: 'w05', description: 'Widow, TN, exactly 30', answers: { gender: 'female', maritalStatus: 'widowed', age: 30, state: 'tamil-nadu' } },
  { id: 'w06', description: 'Widow, TN, exactly 59', answers: { gender: 'female', maritalStatus: 'widowed', age: 59, state: 'tamil-nadu' } },
  { id: 'w07', description: 'Widow, TN, 60 (one above band, should roll into old-age pension territory)', answers: { gender: 'female', maritalStatus: 'widowed', age: 60, state: 'tamil-nadu', rationCardType: 'bpl' } },
  { id: 'w08', description: 'Widow, TN, 27 (below band, outside 3yr margin)', answers: { gender: 'female', maritalStatus: 'widowed', age: 27, state: 'tamil-nadu' } },
  { id: 'w09', description: 'Unmarried woman, TN, income exactly 72000 (marriage assistance ceiling)', answers: { gender: 'female', maritalStatus: 'unmarried', state: 'tamil-nadu', householdIncomeAnnual: 72000 } },
  { id: 'w10', description: 'Unmarried woman, TN, income 78000 (near-miss within 8k)', answers: { gender: 'female', maritalStatus: 'unmarried', state: 'tamil-nadu', householdIncomeAnnual: 78000 } },
  { id: 'w11', description: 'Married woman (should not match marriage assistance)', answers: { gender: 'female', maritalStatus: 'married', state: 'tamil-nadu', householdIncomeAnnual: 50000 } },
  { id: 'w12', description: 'Very poor household, BPL, any area (NFBS)', answers: { rationCardType: 'bpl' } },
  { id: 'w13', description: 'Rural household, income exactly 46000 (NFBS rural ceiling)', answers: { areaType: 'rural', householdIncomeAnnual: 46000, rationCardType: 'apl' } },
  { id: 'w14', description: 'Urban household, income 56000 (NFBS urban ceiling)', answers: { areaType: 'urban', householdIncomeAnnual: 56000, rationCardType: 'apl' } },
  { id: 'w15', description: 'Rural household, income 60000, APL (above both NFBS ceilings)', answers: { areaType: 'rural', householdIncomeAnnual: 60000, rationCardType: 'apl' } },

  // --- Workers ---
  { id: 'wk01', description: 'Street vendor, 25, income 150000', answers: { occupation: 'street-vendor', age: 25, householdIncomeAnnual: 150000 } },
  { id: 'wk02', description: 'Construction worker, exactly 18', answers: { occupation: 'construction-worker', age: 18, householdIncomeAnnual: 100000 } },
  { id: 'wk03', description: 'Domestic worker, exactly 40', answers: { occupation: 'domestic-worker', age: 40, householdIncomeAnnual: 120000 } },
  { id: 'wk04', description: 'Unorganised worker, 41 (one year over, within 2yr margin)', answers: { occupation: 'unorganised-worker', age: 41, householdIncomeAnnual: 100000 } },
  { id: 'wk05', description: 'Self-employed, 45 (well outside age margin)', answers: { occupation: 'self-employed', age: 45, householdIncomeAnnual: 100000 } },
  { id: 'wk06', description: 'Salaried govt employee, 30 (wrong occupation category)', answers: { occupation: 'salaried-govt', age: 30, householdIncomeAnnual: 100000 } },
  { id: 'wk07', description: 'Fisherperson, 30, income exactly 180000 (ceiling)', answers: { occupation: 'fisherperson', age: 30, householdIncomeAnnual: 180000 } },
  { id: 'wk08', description: 'Fisherperson, 30, income 200000 (near-miss within 24k)', answers: { occupation: 'fisherperson', age: 30, householdIncomeAnnual: 200000 } },
  { id: 'wk09', description: 'Any adult, age 18-70, for accident insurance (PMSBY)', answers: { age: 35 } },
  { id: 'wk10', description: 'Person aged exactly 70 (PMSBY upper boundary)', answers: { age: 70 } },
  { id: 'wk11', description: 'Person aged 71 (one over, within 1yr margin)', answers: { age: 71 } },
  { id: 'wk12', description: 'Person aged 17 (one under, within 1yr margin)', answers: { age: 17 } },

  // --- Health insurance ---
  { id: 'h01', description: 'BPL household (PMJAY by ration card)', answers: { rationCardType: 'bpl' } },
  { id: 'h02', description: 'Homeless household (PMJAY by housing)', answers: { houseOwnership: 'homeless', rationCardType: 'apl' } },
  { id: 'h03', description: 'APL household in pucca house (should not match PMJAY)', answers: { rationCardType: 'apl', houseOwnership: 'own-pucca' } },
  { id: 'h04', description: 'Govt employee, BPL card but excluded occupation', answers: { rationCardType: 'bpl', occupation: 'salaried-govt' } },
  { id: 'h05', description: 'No ration card or housing info at all (fully unknown)', answers: {} },

  // --- Mixed / sparse-answer "unknown" cases ---
  { id: 'u01', description: 'Only age given, nothing else', answers: { age: 45 } },
  { id: 'u02', description: 'Only gender given, nothing else', answers: { gender: 'female' } },
  { id: 'u03', description: 'Completely empty answer set', answers: {} },
]

/**
 * Fully-answered personas (every registry question has a real value) used
 * only for the question-efficiency measurement: they simulate a real user
 * who always has an answer, so the adaptive selector's stopping point
 * reflects genuine result convergence rather than "ran out of fields to
 * ask" (which is what happens with the sparse PERSONAS above).
 */
export const FULL_PERSONAS: Persona[] = [
  {
    id: 'full01',
    description: 'Elderly BPL widow, Tamil Nadu, no land',
    answers: {
      age: 62, gender: 'female', maritalStatus: 'widowed', state: 'tamil-nadu', areaType: 'rural',
      occupation: 'retired', educationLevel: 'primary', currentlyStudying: false, householdIncomeAnnual: 60000,
      rationCardType: 'bpl', landOwnedAcres: 0, houseOwnership: 'own-kutcha', disabilityPercentage: 0,
      socialCategory: 'bc', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 0, employmentRegistered: false,
    },
  },
  {
    id: 'full02',
    description: 'Young TN farmer with land, middling income',
    answers: {
      age: 34, gender: 'male', maritalStatus: 'married', state: 'tamil-nadu', areaType: 'rural',
      occupation: 'farmer', educationLevel: 'secondary', currentlyStudying: false, householdIncomeAnnual: 150000,
      rationCardType: 'apl', landOwnedAcres: 2.5, houseOwnership: 'own-pucca', disabilityPercentage: 0,
      socialCategory: 'general', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 2, employmentRegistered: false,
    },
  },
  {
    id: 'full03',
    description: 'TN college girl, SC, low income, studying',
    answers: {
      age: 19, gender: 'female', maritalStatus: 'unmarried', state: 'tamil-nadu', areaType: 'urban',
      occupation: 'student', educationLevel: 'undergraduate', currentlyStudying: true, householdIncomeAnnual: 140000,
      rationCardType: 'bpl', landOwnedAcres: 0, houseOwnership: 'rented', disabilityPercentage: 0,
      socialCategory: 'sc', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 0, employmentRegistered: false,
    },
  },
  {
    id: 'full04',
    description: 'Urban street vendor, 28, income near threshold',
    answers: {
      age: 28, gender: 'male', maritalStatus: 'married', state: 'tamil-nadu', areaType: 'urban',
      occupation: 'street-vendor', educationLevel: 'upper-primary', currentlyStudying: false, householdIncomeAnnual: 170000,
      rationCardType: 'apl', landOwnedAcres: 0, houseOwnership: 'rented', disabilityPercentage: 0,
      socialCategory: 'mbc-dnc', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 1, employmentRegistered: true,
    },
  },
  {
    id: 'full05',
    description: 'Person with 55% disability, unmarried, 30, TN',
    answers: {
      age: 30, gender: 'male', maritalStatus: 'unmarried', state: 'tamil-nadu', areaType: 'rural',
      occupation: 'unemployed', educationLevel: 'secondary', currentlyStudying: false, householdIncomeAnnual: 90000,
      rationCardType: 'bpl', landOwnedAcres: 0, houseOwnership: 'own-kutcha', disabilityPercentage: 55,
      socialCategory: 'general', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 0, employmentRegistered: false,
    },
  },
  {
    id: 'full06',
    description: 'Minority college student, outside TN, high income (should match little)',
    answers: {
      age: 21, gender: 'male', maritalStatus: 'unmarried', state: 'other', areaType: 'urban',
      occupation: 'student', educationLevel: 'postgraduate', currentlyStudying: true, householdIncomeAnnual: 800000,
      rationCardType: 'apl', landOwnedAcres: 0, houseOwnership: 'own-pucca', disabilityPercentage: 0,
      socialCategory: 'general', religionMinority: true, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 0, employmentRegistered: false,
    },
  },
  {
    id: 'full07',
    description: 'Pregnant homemaker, 24, rural TN, poor',
    answers: {
      age: 24, gender: 'female', maritalStatus: 'married', state: 'tamil-nadu', areaType: 'rural',
      occupation: 'homemaker', educationLevel: 'secondary', currentlyStudying: false, householdIncomeAnnual: 70000,
      rationCardType: 'bpl', landOwnedAcres: 0, houseOwnership: 'own-kutcha', disabilityPercentage: 0,
      socialCategory: 'bc', religionMinority: false, receivesPension: 'none', bankAccountExists: true,
      childrenInSchoolCount: 1, employmentRegistered: false,
    },
  },
  {
    id: 'full08',
    description: 'Retired govt employee, 68, comfortable income (should match little/nothing)',
    answers: {
      age: 68, gender: 'male', maritalStatus: 'married', state: 'tamil-nadu', areaType: 'urban',
      occupation: 'retired', educationLevel: 'postgraduate', currentlyStudying: false, householdIncomeAnnual: 600000,
      rationCardType: 'apl', landOwnedAcres: 0, houseOwnership: 'own-pucca', disabilityPercentage: 0,
      socialCategory: 'general', religionMinority: false, receivesPension: 'other-pension', bankAccountExists: true,
      childrenInSchoolCount: 0, employmentRegistered: false,
    },
  },
]
