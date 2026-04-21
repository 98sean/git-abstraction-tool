import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'
import { ProjectAiSettings } from '../types'
import { useToast } from './useToast'

const defaultProjectAiSettings: ProjectAiSettings = {
  auto_save_message_enabled: false,
  ai_diff_consent_granted: false,
  ai_diff_consent_granted_at: null
}

export function useProjectAiSettings(projectId: string | null): {
  settings: ProjectAiSettings
  updateSettings: (patch: Partial<ProjectAiSettings>) => Promise<ProjectAiSettings>
} {
  const [settings, setSettings] = useState<ProjectAiSettings>(defaultProjectAiSettings)
  const { addToast } = useToast()

  useEffect(() => {
    if (!projectId) {
      setSettings(defaultProjectAiSettings)
      return
    }

    invokeDb<ProjectAiSettings>('ai:project-settings:get', projectId)
      .then(setSettings)
      .catch(() => {
        addToast('Could not load project AI settings.', 'error')
      })
  }, [addToast, projectId])

  const updateSettings = useCallback(
    async (patch: Partial<ProjectAiSettings>): Promise<ProjectAiSettings> => {
      if (!projectId) {
        return settings
      }

      const nextSettings = await invokeDb<ProjectAiSettings>('ai:project-settings:set', projectId, patch)
      setSettings(nextSettings)
      return nextSettings
    },
    [projectId, settings]
  )

  return { settings, updateSettings }
}
