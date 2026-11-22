import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { readJSON, writeJSON, clearAllAppStorage } from './storage'
import { makeInitialSession, makePerson, type SessionState, type TrackerEntry, type TrackerStatus } from './types'
import { QUESTION_BY_ID } from '../data/questions'
import type { AnswerValue } from '../types/questions'

const STORAGE_PREFIX = 'tt.'
const SESSION_KEY = `${STORAGE_PREFIX}session`

type Action =
  | { type: 'setAnswer'; personId: string; questionId: string; value: AnswerValue }
  | { type: 'skipQuestion'; personId: string; questionId: string }
  | { type: 'addMember'; nickname: string }
  | { type: 'removeMember'; personId: string }
  | { type: 'setActivePerson'; personId: string }
  | { type: 'resetPersonAnswers'; personId: string } // "reset for next person" in assisted mode
  | { type: 'resetAll' }
  | { type: 'setTrackerEntry'; entry: TrackerEntry }
  | { type: 'toggleHaveDocument'; documentId: string }
  | { type: 'setHighestValueFirst'; value: boolean }
  | { type: 'loadState'; state: SessionState }

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'loadState':
      return action.state

    case 'setAnswer': {
      const question = QUESTION_BY_ID[action.questionId]
      if (!question) return state
      if (question.subject === 'household') {
        return {
          ...state,
          household: {
            ...state.household,
            sharedAnswers: { ...state.household.sharedAnswers, [action.questionId]: action.value },
            sharedAskedIds: Array.from(new Set([...state.household.sharedAskedIds, action.questionId])),
          },
        }
      }
      return {
        ...state,
        household: {
          ...state.household,
          members: state.household.members.map((m) =>
            m.id === action.personId
              ? {
                  ...m,
                  answers: { ...m.answers, [action.questionId]: action.value },
                  askedIds: Array.from(new Set([...m.askedIds, action.questionId])),
                }
              : m,
          ),
        },
      }
    }

    case 'skipQuestion': {
      const question = QUESTION_BY_ID[action.questionId]
      if (!question) return state
      if (question.subject === 'household') {
        return {
          ...state,
          household: {
            ...state.household,
            sharedSkippedIds: Array.from(new Set([...state.household.sharedSkippedIds, action.questionId])),
          },
        }
      }
      return {
        ...state,
        household: {
          ...state.household,
          members: state.household.members.map((m) =>
            m.id === action.personId
              ? { ...m, skippedIds: Array.from(new Set([...m.skippedIds, action.questionId])) }
              : m,
          ),
        },
      }
    }

    case 'addMember': {
      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      return {
        ...state,
        household: { ...state.household, members: [...state.household.members, makePerson(id, action.nickname)] },
      }
    }

    case 'removeMember': {
      const members = state.household.members.filter((m) => m.id !== action.personId)
      const activePersonId = state.activePersonId === action.personId ? (members[0]?.id ?? 'self') : state.activePersonId
      return { ...state, household: { ...state.household, members }, activePersonId }
    }

    case 'setActivePerson':
      return { ...state, activePersonId: action.personId }

    case 'resetPersonAnswers': {
      return {
        ...state,
        household: {
          ...state.household,
          members: state.household.members.map((m) =>
            m.id === action.personId ? { ...m, answers: {}, askedIds: [], skippedIds: [] } : m,
          ),
        },
      }
    }

    case 'resetAll':
      return makeInitialSession()

    case 'setTrackerEntry': {
      const existingIdx = state.trackerEntries.findIndex(
        (e) => e.schemeId === action.entry.schemeId && e.personId === action.entry.personId,
      )
      const trackerEntries = [...state.trackerEntries]
      if (existingIdx >= 0) trackerEntries[existingIdx] = action.entry
      else trackerEntries.push(action.entry)
      return { ...state, trackerEntries }
    }

    case 'toggleHaveDocument': {
      const has = state.haveDocuments.includes(action.documentId)
      return {
        ...state,
        haveDocuments: has
          ? state.haveDocuments.filter((d) => d !== action.documentId)
          : [...state.haveDocuments, action.documentId],
      }
    }

    case 'setHighestValueFirst':
      return { ...state, highestValueFirst: action.value }

    default:
      return state
  }
}

interface SessionContextValue {
  state: SessionState
  dispatch: React.Dispatch<Action>
  deleteEverything: () => void
  setTrackerStatus: (schemeId: string, personId: string, status: TrackerStatus, notes?: string) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => readJSON(SESSION_KEY, makeInitialSession()))

  useEffect(() => {
    writeJSON(SESSION_KEY, state)
  }, [state])

  const deleteEverything = () => {
    clearAllAppStorage(STORAGE_PREFIX)
    dispatch({ type: 'resetAll' })
  }

  const setTrackerStatus = (schemeId: string, personId: string, status: TrackerStatus, notes = '') => {
    dispatch({
      type: 'setTrackerEntry',
      entry: { schemeId, personId, status, notes, date: new Date().toISOString().slice(0, 10) },
    })
  }

  const value = useMemo(
    () => ({ state, dispatch, deleteEverything, setTrackerStatus }),
    [state],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
