import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { Preferences, Project, Toast } from '../types'
import { invokeDb } from '../ipc'

interface AppState {
  projects: Project[]
  activeProjectId: string | null
  preferences: Preferences
  toasts: Toast[]
}

type AppAction =
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'SET_ACTIVE_PROJECT'; project_id: string | null }
  | { type: 'SET_PREFERENCES'; preferences: Preferences }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }

const defaultPreferences: Preferences = {
  theme: 'light',
  mode: 'pro',
  auto_save_enabled: true,
  default_save_message_template: ''
}

const initialState: AppState = {
  projects: [],
  activeProjectId: null,
  preferences: defaultPreferences,
  toasts: []
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects }
    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.project_id }
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.preferences }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.dataset.theme = state.preferences.theme
  }, [state.preferences.theme])

  // Load initial data from main process
  useEffect(() => {
    Promise.all([
      invokeDb<Project[]>('db:projects:list'),
      invokeDb<Preferences>('db:preferences:get')
    ]).then(([projects, preferences]) => {
      dispatch({ type: 'SET_PROJECTS', projects })
      dispatch({ type: 'SET_PREFERENCES', preferences })
      if (projects.length > 0) {
        dispatch({ type: 'SET_ACTIVE_PROJECT', project_id: projects[0].project_id })
      }
    })
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
