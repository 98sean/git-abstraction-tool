import {
  createManualToolService
} from '../ai/manualToolService'
import {
  WeeklyFeatureStats,
  WeeklyFeatureSummaryEntry
} from '../ai/manualToolTypes'
import { generateFileInsight } from '../ai/fileInsightService'
import { createAiService } from '../ai/service'
import { AiProviderName } from '../ai/types'
import { generateNaturalUndoSuggestion } from '../ai/naturalUndoService'
import { reviewUntrackedFiles } from '../ai/untrackedReviewService'
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
import { createHash } from 'node:crypto'
import { clearAiApiKey, getAiApiKey, setAiApiKey } from '../db/credentials'
import { getProjectAiSettings, ProjectAiSettings, setProjectAiSettings } from '../db/projectAiSettings'
import { listProjects } from '../db/projects'
import { getGitService } from '../git'
import { GitWeeklyService } from '../git/weekly-service'
import { WeeklyCommit } from '../git/types'
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
      const weeklyReport = await weeklyService.getWeeklyLog(
        startDate,
        endDate,
        project_id,
        project.friendly_name
      )
      const weekCommits: WeeklyCommit[] = weeklyReport.commits

      const stats: WeeklyFeatureStats = {
        totalCommits: weeklyReport.summary.totalCommits,
        filesAdded: weeklyReport.summary.filesAdded,
        filesModified: weeklyReport.summary.filesModified,
        filesDeleted: weeklyReport.summary.filesDeleted,
        linesAdded: weeklyReport.summary.totalInsertions,
        linesRemoved: weeklyReport.summary.totalDeletions,
        activeDays: weeklyReport.dailyBreakdown.filter((d) => d.commitCount > 0).length
      }

      if (weekCommits.length === 0) {
        return {
          summary: '',
          highlights: [] as string[],
          commit_count: 0,
          ai_summary_count: 0,
          has_entries: false,
          stats
        }
      }

      const summariesByHash = getAiCommitSummariesByHash(
        project_id,
        weekCommits.map((c) => c.hash)
      )

      const entries: WeeklyFeatureSummaryEntry[] = weekCommits
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((commit) => {
          const ai = summariesByHash.get(commit.hash)
          return {
            hash: commit.hash,
            date: commit.date,
            message: commit.message,
            ai_summary: ai?.summary,
            change_kind: ai?.change_kind,
            user_visible: ai?.user_visible,
            areas: ai?.areas,
            keywords: ai?.keywords,
            is_initial_import: commit.is_initial_import
          }
        })

      const aiSummaryCount = entries.filter((entry) => Boolean(entry.ai_summary)).length
      const commitSignature = createHash('sha256')
        .update(entries.map((e) => `${e.hash}:${e.ai_summary ? 1 : 0}`).join('|'))
        .digest('hex')

      const cached = getCachedWeeklySummary({
        project_id,
        start_date: startDate,
        end_date: endDate,
        commit_signature: commitSignature,
        model: aiConfig.model,
        ai_summary_count: aiSummaryCount
      })

      if (cached) {
        return {
          summary: cached.summary,
          highlights: cached.highlights,
          commit_count: cached.commit_count,
          ai_summary_count: cached.ai_summary_count,
          has_entries: true,
          stats: cached.stats,
          cached: true
        }
      }

      const result = await manualToolService.generateWeeklyFeatureSummary({
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey,
        startDate,
        endDate,
        entries,
        stats
      })

      setCachedWeeklySummary({
        project_id,
        start_date: startDate,
        end_date: endDate,
        commit_signature: commitSignature,
        model: aiConfig.model,
        ai_summary_count: aiSummaryCount,
        summary: result.summary,
        highlights: result.highlights,
        commit_count: entries.length,
        stats,
        created_at: Date.now()
      })

      return {
        summary: result.summary,
        highlights: result.highlights,
        commit_count: entries.length,
        ai_summary_count: aiSummaryCount,
        has_entries: true,
        stats,
        cached: false
      }
    }
  })
}
