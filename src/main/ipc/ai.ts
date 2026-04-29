import {
  createManualToolService
} from '../ai/manualToolService'
import { generateFileInsight } from '../ai/fileInsightService'
import { createAiService } from '../ai/service'
import { AiProviderName } from '../ai/types'
import { generateNaturalUndoSuggestion } from '../ai/naturalUndoService'
import { reviewUntrackedFiles } from '../ai/untrackedReviewService'
import { generateWeeklySummary } from '../ai/weeklySummaryService'
import {
  AiConnectionState,
  getAiConnectionState,
  clearAiConnectionState,
  setAiConnectionState
} from '../db/aiConnection'
import {
  getAiCommitSummariesByHash
} from '../db/aiSummaries'
import {
  getCachedWeeklySummary,
  setCachedWeeklySummary
} from '../db/weeklySummaryCache'
import { clearAiApiKey, getAiApiKey, setAiApiKey } from '../db/credentials'
import { getProjectAiSettings, ProjectAiSettings, setProjectAiSettings } from '../db/projectAiSettings'
import { listProjects } from '../db/projects'
import { getGitService } from '../git'
import { GitWeeklyService } from '../git/weekly-service'
import { registerAiConnectionHandlers } from './aiConnectionHandlers'
import { registerAiManualToolHandlers } from './aiManualToolHandlers'
import { registerAiSaveHandlers } from './aiSaveHandlers'
import { registerAiWeeklyHandlers } from './aiWeeklyHandlers'

const aiService = createAiService()
const manualToolService = createManualToolService({ aiService })

function getProjectPath(projectId: string): string {
  const project = listProjects().find((p) => p.project_id === projectId)
  if (!project) throw new Error('Project not found.')
  return project.local_path
}

function getConnectedAiConfig(): { provider: AiProviderName; apiKey: string; model: string } {
  const connectionState = getAiConnectionState()
  const apiKey = getAiApiKey()

  if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
    throw new Error('Connect AI to use this analysis feature.')
  }

  if (!aiService.supportsManualTools(connectionState.provider)) {
    throw new Error('The current AI connection does not support this analysis feature.')
  }

  return {
    provider: connectionState.provider,
    apiKey,
    model: connectionState.selected_model
  }
}

function getUsableAiConnectionState(): AiConnectionState {
  const connectionState = getAiConnectionState()

  if (connectionState.connection_status !== 'connected') {
    return connectionState
  }

  if (getAiApiKey()) {
    return connectionState
  }

  return {
    ...connectionState,
    connection_status: 'invalid'
  }
}

export function registerAiHandlers(): void {
  registerAiConnectionHandlers({
    getConnection: () => getUsableAiConnectionState(),
    connect: async (provider: AiProviderName, apiKey: string) => {
      const connectionState = await aiService.connectProvider({ provider, apiKey })

      setAiApiKey(apiKey)
      setAiConnectionState(connectionState)

      return getAiConnectionState()
    },
    disconnect: () => {
      clearAiApiKey()
      clearAiConnectionState()
      return getAiConnectionState()
    },
    setModel: (model: string) => {
      const currentState = getAiConnectionState()

      if (!currentState.provider) {
        return currentState
      }

      setAiConnectionState({
        ...currentState,
        selected_model: model
      })

      return getAiConnectionState()
    },
    getProjectSettings: (project_id: string) => getProjectAiSettings(project_id),
    setProjectSettings: (project_id: string, patch: Partial<ProjectAiSettings>) => {
      const currentSettings = getProjectAiSettings(project_id)
      const nextSettings: ProjectAiSettings = {
        ...currentSettings,
        ...patch
      }

      if (
        patch.ai_diff_consent_granted === true &&
        !currentSettings.ai_diff_consent_granted &&
        patch.ai_diff_consent_granted_at === undefined
      ) {
        nextSettings.ai_diff_consent_granted_at = Date.now()
      }

      if (patch.ai_diff_consent_granted === false) {
        nextSettings.ai_diff_consent_granted_at = null
      }

      setProjectAiSettings(project_id, nextSettings)
      return getProjectAiSettings(project_id)
    }
  })

  registerAiSaveHandlers({
    generateAutoSaveMessage: async (project_id: string) => {
    const connectionState = getAiConnectionState()
    const projectSettings = getProjectAiSettings(project_id)
    const apiKey = getAiApiKey()

    if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
      return null
    }

    if (!projectSettings.auto_save_message_enabled || !projectSettings.ai_diff_consent_granted) {
      return null
    }

    const gitService = getGitService(project_id)
    const diffContext = await gitService.getStagedDiffContext()

    if (!diffContext.diff.trim()) {
      return null
    }

    return aiService.generateAutoSaveMessage({
      provider: connectionState.provider,
      model: connectionState.selected_model,
      apiKey,
      diffContext
    })
    },

    generateCommitSuggestion: async (project_id: string) => {
    const connectionState = getAiConnectionState()
    const apiKey = getAiApiKey()

    if (!connectionState.provider || !connectionState.selected_model || !apiKey) {
      throw new Error('Connect AI to use AI Suggest.')
    }

    const diff = await getGitService(project_id).getStagedDiff()
    return aiService.generateCommitSuggestion({
      provider: connectionState.provider,
      model: connectionState.selected_model,
      apiKey,
      diff
    })
    }
  })

  registerAiManualToolHandlers({
    suggestUndo: async (project_id: string, query: string) => {
    const aiConfig = getConnectedAiConfig()
    const service = getGitService(project_id)

    return generateNaturalUndoSuggestion({
      projectId: project_id,
      query,
      aiConfig,
      gitService: service,
      manualToolService,
      getSummariesByHash: getAiCommitSummariesByHash
    })
    },

    generateFileInsight: async (project_id: string, file_path: string) => {
    const projectRoot = getProjectPath(project_id)
    const aiConfig = getConnectedAiConfig()
    const service = getGitService(project_id)

    return generateFileInsight({
      projectRoot,
      filePath: file_path ?? '',
      aiConfig,
      gitService: service,
      manualToolService
    })
    },

    reviewUntracked: async (project_id: string) => {
    const aiConfig = getConnectedAiConfig()
    const projectRoot = getProjectPath(project_id)
    const service = getGitService(project_id)

    return reviewUntrackedFiles({
      projectRoot,
      aiConfig,
      gitService: service,
      manualToolService
    })
    }
  })

  registerAiWeeklyHandlers({
    generateWeeklySummary: async (project_id: string, startDate: string, endDate: string) => {
      const aiConfig = getConnectedAiConfig()

      const project = listProjects().find((p) => p.project_id === project_id)
      if (!project) {
        throw new Error('Project not found. Please reconnect.')
      }

      const weeklyService = new GitWeeklyService(project.local_path)
      return generateWeeklySummary({
        projectId: project_id,
        projectName: project.friendly_name,
        startDate,
        endDate,
        aiConfig,
        weeklyService,
        manualToolService,
        getSummariesByHash: getAiCommitSummariesByHash,
        getCachedSummary: getCachedWeeklySummary,
        setCachedSummary: setCachedWeeklySummary
      })
    }
  })
}
