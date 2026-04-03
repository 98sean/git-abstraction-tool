import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { invokeDb } from '../ipc'
import { Preferences } from '../types'

export function usePreferences(): {
  preferences: Preferences
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>
} {
  const { state, dispatch } = useAppContext()

  const setPreference = useCallback(
    async <K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> => {
      await invokeDb('db:preferences:set', key, value)
      dispatch({
        type: 'SET_PREFERENCES',
        preferences: { ...state.preferences, [key]: value }
      })
    },
    [dispatch, state.preferences]
  )

  return { preferences: state.preferences, setPreference }
}
