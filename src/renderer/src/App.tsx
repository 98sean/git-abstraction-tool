import { useEffect, useMemo, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb, invokeGit } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useAiConnection } from './hooks/useAiConnection'
import { useAutoSaveMessage } from './hooks/useAutoSaveMessage'
import { useBranches } from './hooks/useBranches'
import { useCloudSetup } from './hooks/useCloudSetup'
import { useFileInsight } from './hooks/useFileInsight'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjectAiSettings } from './hooks/useProjectAiSettings'
import { useProjectLinkWizard } from './hooks/useProjectLinkWizard'
import { useProjects } from './hooks/useProjects'
import { useNaturalUndo } from './hooks/useNaturalUndo'
import { usePullUpdates } from './hooks/usePullUpdates'
import { useTerms } from './hooks/useTerms'
import { useToast } from './hooks/useToast'
import { AIConsentDialog } from './components/AIConsentDialog/AIConsentDialog'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { AIStatus, ConnectAI } from './components/ConnectAI/ConnectAI'
import { BranchSelector } from './components/BranchSelector/BranchSelector'
import { CloudSetupWizard } from './components/CloudSetupWizard/CloudSetupWizard'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { DangerZoneUploadDialog } from './components/DangerZoneUploadDialog/DangerZoneUploadDialog'
import { FileInsightPanel } from './components/FileInsightPanel/FileInsightPanel'
import { FileManager } from './components/FileManager/FileManager'
import { GitNotInstalled } from './components/GitNotInstalled/GitNotInstalled'
import { NotARepo } from './components/NotARepo/NotARepo'
import { ProjectLinkWizard } from './components/ProjectLinkWizard/ProjectLinkWizard'
import { ProjectSettingsPanel } from './components/ProjectSettingsPanel/ProjectSettingsPanel'
import { PullUpdatesDialog } from './components/PullUpdatesDialog/PullUpdatesDialog'
import { Sidebar } from './components/Sidebar/Sidebar'
import { WeeklyReport } from './components/WeeklyReport'
import { FloatingPanel } from './components/FloatingPanel/FloatingPanel'
import { ConflictResolver } from './components/ConflictResolver/ConflictResolver'
import { ToastContainer } from './components/shared/Toast'
import {
  BranchCreateResult,
  BranchDeleteResult,
  BranchMergeResult,
  AiCommitSuggestion,
  CommitAiMetadata,
  ProjectAiSettings,
  ProjectCloudTarget,
  PushConfiguredTargetResult,
  PushToCloudOptions,
  UntrackedDeleteResult,
  UntrackedReviewResult
} from './types'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, removeProject, setActiveProject } = useProjects()
  const { preferences, setPreference } = usePreferences()
  const t = useTerms()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const { connectionStatus, connect, disconnect, setModel } = useAiConnection()
  const { settings: projectAiSettings, updateSettings: updateProjectAiSettings } =
    useProjectAiSettings(activeProjectId)
  const { generate: generateAutoMessage } = useAutoSaveMessage(activeProjectId)
  const linkWizard = useProjectLinkWizard({
    onLinked: (project) => addToast(t.repoAdded(project.friendly_name), 'success')
  })

  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showProjectSettingsPanel, setShowProjectSettingsPanel] = useState(false)
  const [showConflictResolver, setShowConflictResolver] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [showAiConsentDialog, setShowAiConsentDialog] = useState(false)
  const [pendingDangerTarget, setPendingDangerTarget] = useState<ProjectCloudTarget | null>(null)
  const [uploadHandoff, setUploadHandoff] = useState<PushConfiguredTargetResult | null>(null)
  const [protectedBranch, setProtectedBranch] = useState<string | null>(null)
  const [gitInstalled, setGitInstalled] = useState<boolean | null>(null)
  const [commitMessage, setCommitMessage] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<AiCommitSuggestion | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const manualAiToolsEnabled =
    connectionStatus.connection_status === 'connected' &&
    Boolean(connectionStatus.selected_model)

  const checkGitInstall = (): void => {
    setGitInstalled(null)
    invokeDb<{ installed: boolean }>('git:install:check')
      .then(({ installed }) => {
        setGitInstalled(installed)
      })
      .catch(() => {
        setGitInstalled(false)
      })
  }

  useEffect(checkGitInstall, [])

  useEffect(() => {
    setShowWeeklyReport(false)
    setProtectedBranch(null)
    setUploadHandoff(null)
    setShowConflictResolver(false)
  }, [activeProjectId])

  const {
    status,
    loading: statusLoading,
    error: statusError,
    fetchStatus,
    stage,
    unstage,
    stageAll,
    unstageAll,
    revertFile
  } = useFileStatus(activeProjectId)

  useEffect(() => {
    if (status?.has_conflicts) {
      setShowConflictResolver(true)
    }
  }, [status?.has_conflicts])

  const {
    branches,
    loading: branchesLoading,
    fetchDefaultBranch,
    switchBranch,
    createBranch,
    mergeBranch,
    deleteBranch,
    fetchBranches
  } = useBranches(activeProjectId)

  const naturalUndo = useNaturalUndo({
    activeProjectId,
    invokeDb,
    invokeGit,
    refreshStatus: fetchStatus,
    refreshBranches: fetchBranches,
    addToast
  })
  const {
    suggestion: naturalUndoSuggestion,
    loading: naturalUndoLoading,
    applying: naturalUndoApplying,
    error: naturalUndoError,
    suggest: handleSuggestNaturalUndo,
    apply: handleApplyNaturalUndo,
    cancel: handleCancelNaturalUndo,
    selectAlternative: handleSelectNaturalUndoAlternative,
    reset: resetNaturalUndo
  } = naturalUndo

  useEffect(() => {
    resetNaturalUndo()
  }, [activeProjectId, resetNaturalUndo])

  const fileInsightState = useFileInsight({
    activeProjectId,
    enabled: manualAiToolsEnabled,
    invokeDb
  })
  const {
    selectedPath: selectedFilePath,
    insight: fileInsight,
    loading: fileInsightLoading,
    error: fileInsightError,
    selectFile: handleSelectFile,
    reset: resetFileInsight
  } = fileInsightState

  useEffect(() => {
    resetFileInsight()
  }, [activeProjectId, resetFileInsight])

  const {
    loading: actionLoading,
    error: actionError,
    commit,
    push,
    pull,
    clearError
  } = useGitActions(activeProjectId, {
    onCommitSuccess: () => {
      fetchStatus()
      addToast(t.committedToast, 'success')
    },
    onPushSuccess: () => {
      fetchStatus()
      addToast(t.pushedToast, 'success')
    },
    onPullSuccess: () => {
      fetchStatus()
      addToast(t.pulledToast, 'success')
    }
  })

  const trackedPaths = status?.tracked_files ?? []
  const isNotARepo = statusError?.code === 'NOT_A_REPO'

  const stagedSignature = useMemo(
    () =>
      (status?.files ?? [])
        .filter((file) => file.staged)
        .map((file) => `${file.path}:${file.status}:${file.oldPath ?? ''}`)
        .sort()
        .join('|'),
    [status]
  )

  useEffect(() => {
    setAiSuggestion(null)
  }, [activeProjectId, stagedSignature])

  useEffect(() => {
    if (commitMessage.trim().length === 0) {
      setCommitMessage(preferences.default_save_message_template)
    }
  }, [preferences.default_save_message_template, commitMessage])

  const handleConnectGitHub = async (token: string): Promise<void> => {
    await saveToken(token)
    setShowGitHubPanel(false)
  }

  const handleConnectAi = async (provider: 'openai' | 'anthropic', apiKey: string): Promise<void> => {
    await connect(provider, apiKey)
  }

  const handleUploadWithTarget = async (
    target: ProjectCloudTarget,
    options?: PushToCloudOptions
  ): Promise<void> => {
    if (
      target.mode === 'collaboration' &&
      target.collaboration?.branchMode === 'danger_default_branch' &&
      !options?.dangerConfirmed
    ) {
      setPendingDangerTarget(target)
      return
    }

    const result = await push(options)
    if (result?.prUrl) {
      setUploadHandoff(result)
    } else if (result) {
      setUploadHandoff(null)
    }
  }

  const cloudSetup = useCloudSetup(activeProject, {
    onReadyToUpload: handleUploadWithTarget
  })

  const pullUpdates = usePullUpdates({
    activeProjectId,
    enabled: cloudSetup.cloudUploadReady && !isNotARepo,
    currentBranch: status?.current_branch ?? null,
    invokeGit,
    pull,
    refreshStatus: fetchStatus
  })
  const {
    preview: pullPreview,
    loading: pullPreviewLoading,
    error: pullPreviewError,
    showDialog: showPullUpdatesDialog,
    loadPreview: loadPullPreview,
    requestPull: handlePullRequest,
    confirmPull: handleConfirmPullFromDialog,
    close: closePullUpdatesDialog,
    reset: resetPullUpdates
  } = pullUpdates

  useEffect(() => {
    resetPullUpdates()
  }, [activeProjectId, resetPullUpdates])

  useEffect(() => {
    if (!activeProjectId) {
      setProtectedBranch(null)
      return
    }

    const remoteName =
      cloudSetup.target.mode === 'collaboration' && cloudSetup.target.collaboration?.remoteName
        ? cloudSetup.target.collaboration.remoteName
        : 'origin'

    let cancelled = false
    void (async () => {
      const detected = await fetchDefaultBranch(remoteName).catch(() => null)
      if (cancelled) return

      if (detected) {
        setProtectedBranch(detected)
        return
      }

      const fallback =
        branches.find((branch) => branch.name === 'main')?.name ??
        branches.find((branch) => branch.name === 'master')?.name ??
        null
      setProtectedBranch(fallback)
    })()

    return () => {
      cancelled = true
    }
  }, [
    activeProjectId,
    branches,
    cloudSetup.target.mode,
    cloudSetup.target.collaboration?.remoteName,
    fetchDefaultBranch
  ])

  const handleAddProject = (): void => {
    linkWizard.open()
  }

  const handleRemoveProject = async (project_id: string): Promise<void> => {
    const project = projects.find((item) => item.project_id === project_id)
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

  const handleToggleLanguage = (): void => {
    setPreference('language', preferences.language === 'ko' ? 'en' : 'ko')
  }

  const handleSuggestCommitMessage = async (): Promise<void> => {
    if (!activeProjectId || !status) return
    const stagedCount = status.files.filter((file) => file.staged).length
    if (stagedCount === 0) return

    setAiLoading(true)
    clearError()
    try {
      const suggestion = await invokeDb<AiCommitSuggestion>('ai:commit-suggestion', activeProjectId)
      setAiSuggestion(suggestion)
      setCommitMessage(suggestion.message)
      addToast(t.aiDraftReady, 'info')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'AI could not summarize these changes right now.'
      addToast(message, 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleCommit = async (): Promise<void> => {
    if (!status) return
    const stagedCount = status.files.filter((file) => file.staged).length
    if (stagedCount === 0) return

    const trimmedMessage = commitMessage.trim()
    if (trimmedMessage.length === 0) {
      await handleSuggestCommitMessage()
      return
    }

    const metadata: CommitAiMetadata | undefined =
      aiSuggestion && trimmedMessage === aiSuggestion.message ? aiSuggestion : undefined

    const saved = await commit(trimmedMessage, metadata)
    if (!saved) return

    setCommitMessage('')
    setAiSuggestion(null)
  }

  const handleResolveConflict = async (filePath: string, strategy: 'ours' | 'theirs'): Promise<void> => {
    if (!activeProjectId) return
    await invokeGit('git:conflict:resolve', activeProjectId, filePath, strategy)
    await fetchStatus()
  }

  const handleAbortMerge = async (): Promise<void> => {
    if (!activeProjectId) return
    await invokeGit('git:conflict:abort', activeProjectId)
    await fetchStatus()
    addToast(t.abortMergeBtn, 'info')
  }

  const handleCompleteMerge = async (message: string): Promise<void> => {
    if (!activeProjectId || !status) return
    const saved = await commit(message)
    if (!saved) return
    setShowConflictResolver(false)
    addToast(t.committedToast, 'success')
  }

  const handleSuggestMergeMessage = async (): Promise<{ message: string }> => {
    const suggestion = await invokeDb<AiCommitSuggestion>('ai:commit-suggestion', activeProjectId)
    return { message: suggestion.message }
  }

  const handleAnalyzeConflict = async (
    filePath: string
  ): Promise<{ hint: string; recommendation: 'ours' | 'theirs' | 'either' }> => {
    return await invokeDb('ai:conflict:analyze', activeProjectId, filePath)
  }

  const handleOpenGitHubDocs = (): void => {
    invokeDb('shell:openExternal', 'https://github.com/settings/tokens').catch(console.error)
  }

  const handleOpenDevicePage = (): void => {
    const url = deviceFlow?.verification_uri ?? 'https://github.com/login/device'
    invokeDb('shell:openExternal', url).catch(console.error)
  }

  const handleOpenAiDocs = (provider: 'openai' | 'anthropic'): void => {
    const url =
      provider === 'openai'
        ? 'https://developers.openai.com/api/'
        : 'https://docs.anthropic.com/en/api/getting-started'

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
    await cloudSetup.refreshTarget()
    addToast(t.switchedBranchToast(name), 'success')
  }

  const handleCreateBranch = async (name: string): Promise<void> => {
    const result: BranchCreateResult = await createBranch(name)
    await fetchStatus()
    await cloudSetup.refreshTarget()
    addToast(t.createdBranchToast(name), 'success')

    if (result.published) {
      addToast(`Published "${name}" to ${result.remote_name ?? 'origin'}`, 'info')
      return
    }

    const reason = result.publish_error
      ? ` (${result.publish_error})`
      : ''
    addToast(`Created locally only. Use Upload to publish "${name}" to GitHub${reason}`, 'info')
  }

  const handleDeleteBranch = async (name: string): Promise<void> => {
    try {
      if (protectedBranch && name === protectedBranch) {
        addToast(t.protectedBranchMsg(protectedBranch), 'error')
        return
      }

      const currentBranch = status?.current_branch ?? ''
      const deletingCurrentBranch = currentBranch === name

      if (deletingCurrentBranch) {
        const fallbackBranch =
          branches.find((branch) => branch.name === protectedBranch && branch.name !== name)?.name ??
          branches.find((branch) => branch.name === 'main' && branch.name !== name)?.name ??
          branches.find((branch) => branch.name === 'master' && branch.name !== name)?.name ??
          branches.find((branch) => branch.name !== name)?.name ??
          null

        if (!fallbackBranch) {
          addToast('Cannot delete the only remaining branch.', 'error')
          return
        }

        if (!window.confirm(t.deleteCurrentBranchConfirm(name, fallbackBranch))) {
          return
        }

        await switchBranch(fallbackBranch)
        await fetchBranches()
        await fetchStatus()
        await cloudSetup.refreshTarget()
        addToast(t.switchedBranchToast(fallbackBranch), 'info')
      } else if (!window.confirm(t.deleteBranchConfirm(name))) {
        return
      }

      const result: BranchDeleteResult = await deleteBranch(name)
      await fetchStatus()
      await fetchBranches()
      await cloudSetup.refreshTarget()
      addToast(t.deletedBranchToast(name), 'info')

      if (result.remote_deleted) {
        addToast(`Deleted "${name}" from ${result.remote_name ?? 'origin'}`, 'info')
        return
      }

      if (result.remote_name && result.remote_delete_error) {
        addToast(
          `Deleted local branch only. Could not delete remote branch on ${result.remote_name} (${result.remote_delete_error})`,
          'info'
        )
      }
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'Could not delete branch.'
      addToast(message, 'error')
    }
  }

  const handleMergeBranch = async (name: string): Promise<void> => {
    try {
      const result: BranchMergeResult = await mergeBranch(name)
      await fetchStatus()
      addToast(t.mergedBranchToast(result.source_branch, result.target_branch), 'success')
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'Could not merge branch.'
      addToast(message, 'error')
    }
  }

  const handleProjectAiChange = async (patch: Partial<ProjectAiSettings>): Promise<void> => {
    if (patch.auto_save_message_enabled && !projectAiSettings.ai_diff_consent_granted) {
      setShowAiConsentDialog(true)
      return
    }

    await updateProjectAiSettings(patch)
  }

  const handleAcceptAiConsent = async (): Promise<void> => {
    await updateProjectAiSettings({
      auto_save_message_enabled: true,
      ai_diff_consent_granted: true
    })
    setShowAiConsentDialog(false)
  }

  const handleDeclineAiConsent = (): void => {
    setShowAiConsentDialog(false)
  }

  const handleUpload = async (options?: PushToCloudOptions): Promise<void> => {
    if (!activeProject) return

    if (cloudSetup.target.mode === 'none') {
      await cloudSetup.open(true)
      return
    }

    await handleUploadWithTarget(cloudSetup.target, options)
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

  const projectStates = Object.fromEntries(
    projects.map((project) => {
      if (project.project_id === activeProjectId && status) {
        return [project.project_id, status.is_clean ? 'clean' : 'changed'] as const
      }

      return [project.project_id, 'unknown'] as const
    })
  ) as Record<string, 'changed' | 'clean' | 'unknown'>

  return (
    <>
      {gitInstalled === false && <GitNotInstalled onRetry={checkGitInstall} />}

      <div className={styles.app}>
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          theme={preferences.theme}
          mode={preferences.mode}
          language={preferences.language}
          onSelectProject={setActiveProject}
          onRemoveProject={handleRemoveProject}
          onAddProject={handleAddProject}
          onToggleTheme={handleToggleTheme}
          onToggleMode={handleToggleMode}
          onToggleLanguage={handleToggleLanguage}
          onWeeklyReport={() => setShowWeeklyReport((v) => !v)}
          weeklyReportActive={showWeeklyReport}
          projectStates={projectStates}
          githubSlot={
            <GitHubStatus
              connected={tokenExists === true}
              onClick={() => {
                setShowAiPanel(false)
                setShowGitHubPanel((v) => !v)
              }}
            />
          }
          aiSlot={
            <AIStatus
              connected={connectionStatus.connection_status === 'connected'}
              onClick={() => {
                setShowGitHubPanel(false)
                setShowAiPanel((value) => !value)
              }}
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
                    protectedBranch={protectedBranch}
                    branches={branches}
                    loading={branchesLoading}
                    onSwitch={handleSwitchBranch}
                    onCreate={handleCreateBranch}
                    onMerge={handleMergeBranch}
                    onDelete={handleDeleteBranch}
                  />
                )}
                <button
                  className={styles.settingsBtn}
                  onClick={() => setShowProjectSettingsPanel((value) => !value)}
                >
                  {t.projectSettingsTitle}
                </button>
                {status && (status.ahead > 0 || status.behind > 0) && (
                  <span className={styles.aheadBehind}>
                    {status.ahead > 0 && <span>↑ {status.ahead}</span>}
                    {status.behind > 0 && <span>↓ {status.behind}</span>}
                  </span>
                )}
              </header>

              {showWeeklyReport ? (
                <WeeklyReport projectId={activeProjectId} aiConnection={connectionStatus} onClose={() => setShowWeeklyReport(false)} />
              ) : isNotARepo ? (
                <NotARepo projectPath={activeProject.local_path} onInit={handleInitRepo} />
              ) : (
                <div className={styles.workspace}>
                  <FileManager
                    status={status}
                    trackedPaths={trackedPaths}
                    selectedPath={selectedFilePath}
                    loading={statusLoading}
                    error={statusError}
                    aiReviewEnabled={manualAiToolsEnabled}
                    onStage={stage}
                    onUnstage={unstage}
                    onStageAll={stageAll}
                    onUnstageAll={unstageAll}
                    onRevert={revertFile}
                    onSelectFile={(path) => {
                      void handleSelectFile(path)
                    }}
                    onReviewUntracked={handleReviewUntracked}
                    onDeleteUntracked={handleDeleteUntracked}
                  />
                  <FileInsightPanel
                    selectedPath={selectedFilePath}
                    insight={fileInsight}
                    loading={fileInsightLoading}
                    error={fileInsightError}
                    enabled={manualAiToolsEnabled}
                    onRetry={() => {
                      if (selectedFilePath) {
                        void handleSelectFile(selectedFilePath)
                      }
                    }}
                    onSelectRelated={(path) => {
                      void handleSelectFile(path)
                    }}
                  />
                </div>
              )}

              {!showWeeklyReport && <ActionPanel
                status={status}
                loading={actionLoading}
                aiLoading={aiLoading}
                error={isNotARepo ? null : actionError}
                message={commitMessage}
                tokenExists={tokenExists}
                cloudUploadReady={cloudSetup.cloudUploadReady}
                cloudStatusLabel={cloudSetup.cloudStatusLabel}
                uploadHandoff={uploadHandoff}
                aiAutoSaveEnabled={projectAiSettings.auto_save_message_enabled}
                aiConnectionReady={
                  connectionStatus.connection_status === 'connected' &&
                  Boolean(connectionStatus.selected_model)
                }
                naturalUndoEnabled={manualAiToolsEnabled && !isNotARepo}
                naturalUndoSuggestion={naturalUndoSuggestion}
                naturalUndoLoading={naturalUndoLoading}
                naturalUndoApplying={naturalUndoApplying}
                naturalUndoError={naturalUndoError}
                onMessageChange={setCommitMessage}
                onCommit={handleCommit}
                onSuggestMessage={handleSuggestCommitMessage}
                onPush={handleUpload}
                onPull={handlePullRequest}
                onOpenCloudSetup={() => {
                  void cloudSetup.open(true)
                }}
                onClearError={clearError}
                onOpenGitHubConnect={() => setShowGitHubPanel(true)}
                onGenerateAutoMessage={generateAutoMessage}
                onSuggestNaturalUndo={handleSuggestNaturalUndo}
                onApplyNaturalUndo={handleApplyNaturalUndo}
                onCancelNaturalUndo={handleCancelNaturalUndo}
                onSelectNaturalUndoAlternative={handleSelectNaturalUndoAlternative}
              />}
            </>
          ) : (
            <div className={styles.emptyMain}>
              <div className={styles.emptyIcon}>📁</div>
              <h2>Welcome</h2>
              <p>
                {preferences.mode === 'newbie'
                  ? 'Link a project folder from the sidebar to get started.'
                  : 'Add a repository from the sidebar to get started.'}
              </p>
            </div>
          )}
        </div>

        {showAiConsentDialog && (
          <AIConsentDialog
            onAccept={() => {
              void handleAcceptAiConsent()
            }}
            onDecline={handleDeclineAiConsent}
          />
        )}

        <ToastContainer />

        {linkWizard.isOpen && (
          <ProjectLinkWizard
            step={linkWizard.step}
            inspection={linkWizard.inspection}
            folderPath={linkWizard.folderPath}
            friendlyName={linkWizard.friendlyName}
            loading={linkWizard.loading}
            error={linkWizard.error}
            selectedIgnoreEntries={linkWizard.selectedIgnoreEntries}
            onChooseFolder={linkWizard.chooseFolder}
            onToggleIgnoreEntry={linkWizard.toggleIgnoreEntry}
            onApproveInit={linkWizard.approveInit}
            onCancel={linkWizard.close}
            onFinish={linkWizard.finish}
          />
        )}

        {cloudSetup.isOpen && activeProject && (
          <CloudSetupWizard
            intent={cloudSetup.intent}
            loading={cloudSetup.loading}
            error={cloudSetup.error}
            remotes={cloudSetup.remotes}
            branchMode={cloudSetup.branchMode}
            selectedRemoteName={cloudSetup.selectedRemoteName}
            selectedBranch={cloudSetup.selectedBranch}
            onChooseIntent={cloudSetup.chooseIntent}
            onClose={cloudSetup.close}
            onCreateBackup={cloudSetup.createBackup}
            onSelectRemote={cloudSetup.selectRemote}
            onSelectBranchMode={cloudSetup.selectBranchMode}
            onSelectBranch={cloudSetup.setSelectedBranch}
            onContinueCollaboration={cloudSetup.saveCollaborationTarget}
          />
        )}

        {pendingDangerTarget?.mode === 'collaboration' && pendingDangerTarget.collaboration && (
          <DangerZoneUploadDialog
            branchName={pendingDangerTarget.collaboration.selectedBranch ?? 'main'}
            onCancel={() => setPendingDangerTarget(null)}
            onConfirm={() => {
              const target = pendingDangerTarget
              setPendingDangerTarget(null)
              if (!target) return
              void handleUploadWithTarget(target, { dangerConfirmed: true })
            }}
          />
        )}

        {showPullUpdatesDialog && (
          <PullUpdatesDialog
            preview={pullPreview}
            loading={pullPreviewLoading}
            error={pullPreviewError}
            onRefresh={() => {
              void loadPullPreview()
            }}
            onClose={closePullUpdatesDialog}
            onConfirmPull={handleConfirmPullFromDialog}
          />
        )}

        {showAiPanel && (
          <FloatingPanel onClose={() => setShowAiPanel(false)}>
            <ConnectAI
              connectionStatus={connectionStatus}
              onConnect={handleConnectAi}
              onDisconnect={disconnect}
              onOpenProviderDocs={handleOpenAiDocs}
              onSelectModel={setModel}
              onClose={() => setShowAiPanel(false)}
            />
          </FloatingPanel>
        )}

        {showGitHubPanel && (
          <FloatingPanel onClose={() => setShowGitHubPanel(false)}>
            <ConnectGitHub
              isConnected={tokenExists === true}
              onConnect={handleConnectGitHub}
              onDisconnect={clearToken}
              onClose={() => setShowGitHubPanel(false)}
              onOpenGitHubDocs={handleOpenGitHubDocs}
              onOpenDevicePage={handleOpenDevicePage}
              deviceFlow={deviceFlow}
              onStartDeviceFlow={startDeviceFlow}
              onCancelDeviceFlow={cancelDeviceFlow}
            />
          </FloatingPanel>
        )}

        {showConflictResolver && status?.has_conflicts && activeProjectId && (
          <ConflictResolver
            conflictedFiles={status.files.filter((f) => f.status === 'conflicted')}
            aiEnabled={manualAiToolsEnabled}
            onResolve={handleResolveConflict}
            onAbort={handleAbortMerge}
            onComplete={handleCompleteMerge}
            onClose={() => setShowConflictResolver(false)}
            onSuggestMessage={manualAiToolsEnabled ? handleSuggestMergeMessage : undefined}
            onAnalyzeFile={manualAiToolsEnabled ? handleAnalyzeConflict : undefined}
          />
        )}

        {showProjectSettingsPanel && activeProject && (
          <FloatingPanel onClose={() => setShowProjectSettingsPanel(false)}>
            <ProjectSettingsPanel
              aiSettings={projectAiSettings}
              aiConnectionStatus={connectionStatus.connection_status}
              selectedModel={connectionStatus.selected_model}
              cloudTarget={cloudSetup.target}
              protectedBranch={protectedBranch}
              onAiChange={(patch) => {
                void handleProjectAiChange(patch)
              }}
              onOpenAiConnection={() => {
                setShowProjectSettingsPanel(false)
                setShowAiPanel(true)
              }}
              onOpenCloudSetup={() => {
                void cloudSetup.open(false)
              }}
              onClose={() => setShowProjectSettingsPanel(false)}
            />
          </FloatingPanel>
        )}
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
