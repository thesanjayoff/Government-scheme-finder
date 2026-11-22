import type { AnswerMap } from '../types/questions'

export interface Person {
  id: string
  nickname: string
  answers: AnswerMap
  askedIds: string[]
  skippedIds: string[]
}

export interface Household {
  sharedAnswers: AnswerMap
  sharedAskedIds: string[]
  sharedSkippedIds: string[]
  members: Person[]
}

export type TrackerStatus = 'not-started' | 'in-progress' | 'submitted' | 'approved' | 'rejected'

export interface TrackerEntry {
  schemeId: string
  personId: string
  status: TrackerStatus
  date: string // ISO date the status was last changed
  notes: string
}

export interface SessionState {
  household: Household
  activePersonId: string
  trackerEntries: TrackerEntry[]
  /** Document ids the user has said they already have, shared across the session. */
  haveDocuments: string[]
  /** Highest-value-first ranking toggle, persisted as a UX preference. */
  highestValueFirst: boolean
}

export function makePerson(id: string, nickname: string): Person {
  return { id, nickname, answers: {}, askedIds: [], skippedIds: [] }
}

export function makeInitialSession(): SessionState {
  return {
    household: {
      sharedAnswers: {},
      sharedAskedIds: [],
      sharedSkippedIds: [],
      members: [makePerson('self', 'You')],
    },
    activePersonId: 'self',
    trackerEntries: [],
    haveDocuments: [],
    highestValueFirst: false,
  }
}
