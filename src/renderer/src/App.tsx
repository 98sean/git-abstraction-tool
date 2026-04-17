import { useEffect, useRef, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb, invokeGit } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useApiKeys } from './hooks/useApiKeys'
import { useBranches } from './hooks/useBranches'
import { useTerms } from './hooks/useTerms'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjects } from './hooks/useProjects'
import { useToast } from './hooks/useToast'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { ApiKeySettings } from './components/ApiKeySettings/ApiKeySettings'
import { BranchSelector } from './components/BranchSelector/BranchSelector'
import { FileManager } from './components/FileManager/FileManager'
import { FileInsightPanel } from './components/FileInsightPanel/FileInsightPanel'
import { GitNotInstalled } from './components/GitNotInstalled/GitNotInstalled'
import { NotARepo } from './components/NotARepo/NotARepo'
import { Sidebar, pickFolder } from './components/Sidebar/Sidebar'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { ToastContainer } from './components/shared/Toast'
import {
  FileInsight,
  NaturalUndoSuggestion,
  RestoreResult,
  UntrackedDeleteResult,
  UntrackedReviewResult
} from './types'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, addProject, removeProject, setActiveProject } =
    useProjects()
  const { preferences, setPreference } = usePreferences()
  const t = useTerms()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const {
    keys: apiKeys,
    loading: apiKeysLoading,
    setOpenAIKey,
    setAnthropicKey,
    clearOpenAIKey,
    clearAnthropicKey
  } = useApiKeys()
  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [naturalUndoSuggestion, setNaturalUndoSuggestion] = useState<NaturalUndoSuggestion | null>(null)
  const [naturalUndoLoading, setNaturalUndoLoading] = useState(false)
  const [naturalUndoApplying, setNaturalUndoApplying] = useState(false)
  const [naturalUndoError, setNaturalUndoError] = useState<string | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [fileInsight, setFileInsight] = useState<FileInsight | null>(null)
  const [fileInsightLoading, setFileInsightLoading] = useState(false)
  const [fileInsightError, setFileInsightError] = useState<string | null>(null)
  const fileInsightReqRef = useRef(0)

  // Git installation check
  const [gitInstalled, setGitInstalled] = useState<boolean | null>(null)
  const checkGitInstall = (): void => {
    setGitInstalled(null)
    invokeDb<{ installed: boolean }>('git:install:check').then(({ installed }) => {
      setGitInstalled(installed)
    })
  }
  useEffect(checkGitInstall, [])

  const { status, loading: statusLoading, error: statusError, fetchStatus, stage, unstage, stageAll, unstageAll, revertFile } =
    useFileStatus(activeProjectId)

  const { branches, loading: branchesLoading, switchBranch, createBranch, deleteBranch, fetchBranches } =
    useBranches(activeProjectId)

  // tracked_files now comes directly from status (populated by git:status alongside git status)
  const trackedPaths = status?.tracked_files ?? []

  const { loading: actionLoading, error: actionError, commit, push, pull, clearError } =
    useGitActions(activeProjectId, () => {
      fetchStatus()
      addToast(t.committedToast, 'success')
    })

  const handleConnectGitHub = async (token: string): Promise<void> => {
    await saveToken(token)
    setShowGitHubPanel(false)
  }

  const handleAddProject = async (): Promise<void> => {
    const folderPath = await pickFolder()
    if (!folderPath) return
    const parts = folderPath.replace(/\\/g, '/').split('/')
    const projectName = parts[parts.length - 1] || 'My Project'
    try {
      await addProject(folderPath, projectName)
      addToast(t.repoAdded(projectName), 'success')
    } catch {
      addToast(t.repoAddFailed, 'error')
    }
  }

  const handleRemoveProject = async (project_id: string): Promise<void> => {
    const project = projects.find((p) => p.project_id === project_id)
    if (!window.confirm(`Remove "${project?.friendly_name}" from your projects?`)) return
    await removeProject(project_id)
    addToast(t.repoRemoved, 'info')
  }

  const handleToggleTheme = (): void => {
    setPreference('theme', preferences.theme === 'light' ? 'dark' : 'light')
  }

  const handleToggleMode = (): void => {
    setPreference('mode', preferences.mode === 'pro' ? 'newbie' : 'pro')
  }

  const handleOpenGitHubDocs = (): void => {
    invokeDb('shell:openExternal', 'https://github.com/settings/tokens').catch(console.error)
  }

  const handleOpenDevicePage = (): void => {
    const url = deviceFlow?.verification_uri ?? 'https://github.com/login/device'
    invokeDb('shell:openExternal', url).catch(console.error)
  }

  const handleInitRepo = async (): Promise<void> => {
    if (!activeProjectId) return
    await invokeGit('git:init', activeProjectId)
    await fetchStatus()
    await fetchBranches()
    addToast('Repository initialized', 'success')
  }

  const handleSwitchBranch = async (name: string): Promise<void> => {
    await switchBranch(name)
    await fetchStatus()
    addToast(t.switchedBranchToast(name), 'success')
  }

  const handleCreateBranch = async (name: string): Promise<void> => {
    await createBranch(name)
    await fetchStatus()
    addToast(t.createdBranchToast(name), 'success')
  }

  const handleDeleteBranch = async (name: string): Promise<void> => {
    try {
      await deleteBranch(name)
      await fetchStatus()
      addToast(t.deletedBranchToast(name), 'info')
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Could not delete branch.'
      addToast(message, 'error')
    }
  }

  const projectStates = Object.fromEntries(
    projects.map((p) => {
      if (p.project_id === activeProjectId && status) {
        return [p.project_id, status.is_clean ? 'clean' : 'changed'] as const
      }
      return [p.project_id, 'unknown'] as const
    })
  ) as Record<string, 'changed' | 'clean' | 'unknown'>

  const isNotARepo = statusError?.code === 'NOT_A_REPO'

  useEffect(() => {
    setNaturalUndoSuggestion(null)
    setNaturalUndoError(null)
    setNaturalUndoLoading(false)
    setNaturalUndoApplying(false)
    setSelectedFilePath(null)
    setFileInsight(null)
    setFileInsightError(null)
    setFileInsightLoading(false)
    fileInsightReqRef.current += 1
  }, [activeProjectId])

  const handleSuggestNaturalUndo = async (query: string): Promise<void> => {
    if (!activeProjectId) return
    setNaturalUndoLoading(true)
    setNaturalUndoError(null)
    try {
      const suggestion = await invokeDb<NaturalUndoSuggestion>('ai:undo:suggest', activeProjectId, query)
      setNaturalUndoSuggestion(suggestion)
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? 'Could not find a matching point in history.'
      setNaturalUndoError(message)
      setNaturalUndoSuggestion(null)
    } finally {
      setNaturalUndoLoading(false)
    }
  }

  const handleApplyNaturalUndo = async (): Promise<void> => {
    if (!activeProjectId || !naturalUndoSuggestion) return

    setNaturalUndoApplying(true)
    setNaturalUndoError(null)
    try {
      const result = await invokeGit<RestoreResult>(
        'git:restore:apply',
        activeProjectId,
        naturalUndoSuggestion.commit_hash
      )
      await fetchStatus()
      await fetchBranches()
      addToast(
        `Restore complete (restored ${result.restored_files}, removed ${result.removed_files}) | Backup: ${result.backup_branch}`,
        'success'
      )
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Restore failed due to an unexpected error.'
      setNaturalUndoError(message)
    } finally {
      setNaturalUndoApplying(false)
    }
  }

  const handleSelectFile = async (path: string): Promise<void> => {
    if (!activeProjectId) return

    setSelectedFilePath(path)
    setFileInsightError(null)
    setFileInsight(null)

    if (!apiKeys.openai) {
      setFileInsightLoading(false)
      setFileInsightError('OpenAI key is required. Add it in Settings.')
      return
    }

    setFileInsightLoading(true)

    const reqId = fileInsightReqRef.current + 1
    fileInsightReqRef.current = reqId

    try {
      const result = await invokeDb<FileInsight>('ai:file:insight', activeProjectId, path)
      if (fileInsightReqRef.current !== reqId) return
      setFileInsight(result)
    } catch (err) {
      if (fileInsightReqRef.current !== reqId) return
      const message = (err as { message?: string })?.message ?? 'Could not analyze this file.'
      setFileInsightError(message)
    } finally {
      if (fileInsightReqRef.current === reqId) {
        setFileInsightLoading(false)
      }
    }
  }

  const handleReviewUntracked = async (): Promise<UntrackedReviewResult> => {
    if (!activeProjectId) {
      return { items: [], total_untracked: 0, commit_count: 0, delete_count: 0 }
    }
    return await invokeDb<UntrackedReviewResult>('ai:untracked:review', activeProjectId)
  }

  const handleDeleteUntracked = async (paths: string[]): Promise<UntrackedDeleteResult> => {
    if (!activeProjectId || paths.length === 0) {
      return { deleted: 0, failed: [] }
    }
    const result = await invokeGit<UntrackedDeleteResult>('git:untracked:delete', activeProjectId, paths)
    await fetchStatus()
    if (result.deleted > 0) {
      addToast(`Deleted ${result.deleted} untracked file(s).`, 'info')
    }
    if (result.failed.length > 0) {
      addToast(`Failed to delete ${result.failed.length} file(s).`, 'error')
    }
    return result
  }

  return (
    <>
      {gitInstalled === false && (
        <GitNotInstalled onRetry={checkGitInstall} />
      )}

      <div className={styles.app}>
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          theme={preferences.theme}
          mode={preferences.mode}
          onSelectProject={setActiveProject}
          onRemoveProject={handleRemoveProject}
          onAddProject={handleAddProject}
          onToggleTheme={handleToggleTheme}
          onToggleMode={handleToggleMode}
          onOpenSettings={() => setShowSettings(true)}
          projectStates={projectStates}
          githubSlot={
            <GitHubStatus
              connected={tokenExists === true}
              onConnect={() => setShowGitHubPanel(true)}
              onDisconnect={clearToken}
            />
          }
        />

        <div className={styles.main}>
          {activeProject ? (
            <>
              <header className={styles.header}>
                <span className={styles.projectTitle}>{activeProject.friendly_name}</span>
                {status && (
                  <BranchSelector
                    currentBranch={status.current_branch}
                    branches={branches}
                    loading={branchesLoading}
                    onSwitch={handleSwitchBranch}
                    onCreate={handleCreateBranch}
                    onDelete={handleDeleteBranch}
                  />
                )}
                {status && (status.ahead > 0 || status.behind > 0) && (
                  <span className={styles.aheadBehind}>
                    {status.ahead > 0 && <span>↑ {status.ahead}</span>}
                    {status.behind > 0 && <span>↓ {status.behind}</span>}
                  </span>
                )}
              </header>

              {isNotARepo ? (
                <NotARepo
                  projectPath={activeProject.local_path}
                  onInit={handleInitRepo}
                />
              ) : (
                <div className={styles.workspace}>
                  <FileManager
                    status={status}
                    trackedPaths={trackedPaths}
                    selectedPath={selectedFilePath}
                    loading={statusLoading}
                    error={statusError}
                    onStage={stage}
                    onUnstage={unstage}
                    onStageAll={stageAll}
                    onUnstageAll={unstageAll}
                    onRevert={revertFile}
                    onSelectFile={(path) => void handleSelectFile(path)}
                    onReviewUntracked={handleReviewUntracked}
                    onDeleteUntracked={handleDeleteUntracked}
                  />
                  <FileInsightPanel
                    selectedPath={selectedFilePath}
                    insight={fileInsight}
                    loading={fileInsightLoading}
                    error={fileInsightError}
                    enabled={apiKeys.openai}
                    onRetry={() => {
                      if (selectedFilePath) void handleSelectFile(selectedFilePath)
                    }}
                    onSelectRelated={(path) => void handleSelectFile(path)}
                  />
                </div>
              )}

              <ActionPanel
                status={status}
                loading={actionLoading}
                error={isNotARepo ? null : actionError}
                messageTemplate={preferences.default_save_message_template}
                tokenExists={tokenExists}
                forceShowConnect={showGitHubPanel}
                deviceFlow={deviceFlow}
                naturalUndoEnabled={apiKeys.openai && !isNotARepo}
                naturalUndoSuggestion={naturalUndoSuggestion}
                naturalUndoLoading={naturalUndoLoading}
                naturalUndoApplying={naturalUndoApplying}
                naturalUndoError={naturalUndoError}
                onCommit={commit}
                onPush={async () => { await push(); fetchStatus(); addToast(t.pushedToast, 'success') }}
                onPull={async () => { await pull(); fetchStatus(); addToast(t.pulledToast, 'success') }}
                onClearError={clearError}
                onSuggestNaturalUndo={handleSuggestNaturalUndo}
                onApplyNaturalUndo={handleApplyNaturalUndo}
                onConnectGitHub={handleConnectGitHub}
                onOpenGitHubDocs={handleOpenGitHubDocs}
                onOpenDevicePage={handleOpenDevicePage}
                onStartDeviceFlow={startDeviceFlow}
                onCancelDeviceFlow={cancelDeviceFlow}
              />
            </>
          ) : showGitHubPanel && tokenExists !== true ? (
            <div className={styles.emptyMain}>
              <ConnectGitHub
                onConnect={handleConnectGitHub}
                onOpenGitHubDocs={handleOpenGitHubDocs}
                onOpenDevicePage={handleOpenDevicePage}
                deviceFlow={deviceFlow}
                onStartDeviceFlow={startDeviceFlow}
                onCancelDeviceFlow={cancelDeviceFlow}
              />
            </div>
          ) : (
            <div className={styles.emptyMain}>
              <div className={styles.emptyIcon}>📁</div>
              <h2>Welcome</h2>
              <p>{preferences.mode === 'newbie' ? 'Link a project folder from the sidebar to get started.' : 'Add a repository from the sidebar to get started.'}</p>
            </div>
          )}
        </div>

        {showSettings && (
          <ApiKeySettings
            keys={apiKeys}
            loading={apiKeysLoading}
            onSaveOpenAI={setOpenAIKey}
            onSaveAnthropic={setAnthropicKey}
            onClearOpenAI={clearOpenAIKey}
            onClearAnthropic={clearAnthropicKey}
            onClose={() => setShowSettings(false)}
          />
        )}

        <ToastContainer />
      </div>
    </>
  )
}

export default function App(): JSX.Element {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
