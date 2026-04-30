import { AppTerms, getTerms } from '../i18n/terms'
import { usePreferences } from './usePreferences'

export function useTerms(): AppTerms {
  const { preferences } = usePreferences()
  return getTerms(preferences.language ?? 'en', preferences.mode ?? 'pro')
}
