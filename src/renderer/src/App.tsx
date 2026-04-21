import { useEffect, useRef, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb, invokeGit } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useAiConnection } from './hooks/useAiConnection'
import { useAutoSaveMessage } from './hooks/useAutoSaveMessage'
import { useBranches } from './hooks/useBranches'
import { useCloudSetup } from './hooks/useCloudSetup'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjectAiSettings } from './hooks/useProjectAiSettings'
import { useProjectLinkWizard } from './hooks/useProjectLinkWizard'
import { useProjects } from './hooks/useProjects'
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
import { ToastContainer } from './components/shared/Toast'
import {
  FileInsight,
  PullUpdatesPreview,
  NaturalUndoSuggestion,
  ProjectAiSettings,
  ProjectCloudTarget,
  PushToCloudOptions,
  RestoreResult,
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
  const [showAiConsentDialog, setShowAiConsentDialog] = useState(false)
  const [pendingDangerTarget, setPendingDangerTarget] = useState<ProjectCloudTarget | null>(null)
  const [showPullUpdatesDialog, setShowPullUpdatesDialog] = useState(false)
  const [pullPreview, setPullPreview] = useState<PullUpdatesPreview | null>(null)
  const [pullPreviewLoading, setPullPreviewLoading] = useState(false)
  const [pullPreviewError, setPullPreviewError] = useState<string | null>(null)
  const [gitInstalled, setGitInstalled] = useState<boolean | null>(null)
  const [naturalUndoSuggestion, setNaturalUndoSuggestion] = useState<NaturalUndoSuggestion | null>(null)
  const [naturalUndoLoading, setNaturalUndoLoading] = useState(false)
  const [naturalUndoApplying, setNaturalUndoApplying] = useState(false)
  const [naturalUndoError, setNaturalUndoError] = useState<string | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [fileInsight, setFileInsight] = useState<FileInsight | null>(null)
  const [fileInsightLoading, setFileInsightLoading] = useState(false)
  const [fileInsightError, setFileInsightError] = useState<string | null>(null)
  const fileInsightReqRef = useRef(0)
  const lastShownPullUpdateRef = useRef<Record<string, string>>({})

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
    setNaturalUndoSuggestion(null)
    setNaturalUndoError(null)
    setNaturalUndoLoading(false)
    setNaturalUndoApplying(false)
    setSelectedFilePath(null)
    setFileInsight(null)
    setFileInsightError(null)
    setFileInsightLoading(false)
    setPullPreview(null)
    setPullPreviewError(null)
    setShowPullUpdatesDialog(false)
    fileInsightReqRef.current += 1
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

  const {
    branches,
    loading: branchesLoading,
    switchBranch,
    createBranch,
    deleteBranch,
    fetchBranches
  } = useBranches(activeProjectId)

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

    await push(options)
  }

  const cloudSetup = useCloudSetup(activeProject, {
    onReadyToUpload: handleUploadWithTarget
  })

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
        : 'https://platform.claude.com/docs/api-reference'

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
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'Could not delete branch.'
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

  const loadPullPreview = async (refreshAfter = false): Promise<PullUpdatesPreview | null> => {
    if (!activeProjectId) return null

    setPullPreviewLoading(true)
    setPullPreviewError(null)

    try {
      const preview = await invokeGit<PullUpdatesPreview>('git:pull:preview', activeProjectId, 20)
      setPullPreview(preview)
      if (refreshAfter) {
        await fetchStatus()
      }
      return preview
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Could not load incoming updates.'
      setPullPreviewError(message)
      return null
    } finally {
      setPullPreviewLoading(false)
    }
  }

  const handlePullRequest = (): void => {
    void (async () => {
      const preview = await loadPullPreview(true)
      if (preview && preview.behind_count > 0) {
        const fingerprint =
          preview.latest_remote_hash || `${preview.remote_name}/${preview.branch_name}:${preview.behind_count}`
        if (activeProjectId) {
          lastShownPullUpdateRef.current[activeProjectId] = fingerprint
        }
        setShowPullUpdatesDialog(true)
        return
      }

      await pull()
    })()
  }

  const handleConfirmPullFromDialog = (): void => {
    setShowPullUpdatesDialog(false)
    void pull()
  }

  useEffect(() => {
    if (!activeProjectId) return
    if (isNotARepo) return
    if (!status || status.behind <= 0) return
    if (showPullUpdatesDialog) return
    if (!cloudSetup.cloudUploadReady) return

    let cancelled = false

    void (async () => {
      const preview = await loadPullPreview()
      if (cancelled || !preview || preview.behind_count <= 0) return

      const fingerprint =
        preview.latest_remote_hash || `${preview.remote_name}/${preview.branch_name}:${preview.behind_count}`
      if (lastShownPullUpdateRef.current[activeProjectId] === fingerprint) return

      lastShownPullUpdateRef.current[activeProjectId] = fingerprint
      setShowPullUpdatesDialog(true)
    })()

    return () => {
      cancelled = true
    }
  }, [
    activeProjectId,
    cloudSetup.cloudUploadReady,
    isNotARepo,
    showPullUpdatesDialog,
    status?.behind,
    status?.current_branch
  ])

  const handleSuggestNaturalUndo = async (query: string): Promise<void> => {
    if (!activeProjectId) return

    setNaturalUndoLoading(true)
    setNaturalUndoError(null)

    try {
      const suggestion = await invokeDb<NaturalUndoSuggestion>('ai:undo:suggest', activeProjectId, query)
      setNaturalUndoSuggestion(suggestion)
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Could not find a matching point in history.'
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
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Restore failed due to an unexpected error.'
      setNaturalUndoError(message)
    } finally {
      setNaturalUndoApplying(false)
    }
  }

  const handleSelectFile = async (filePath: string): Promise<void> => {
    if (!activeProjectId) return

    setSelectedFilePath(filePath)
    setFileInsightError(null)
    setFileInsight(null)

    if (!manualAiToolsEnabled) {
      setFileInsightLoading(false)
      setFileInsightError('Connect AI to analyze files.')
      return
    }

    setFileInsightLoading(true)

    const requestId = fileInsightReqRef.current + 1
    fileInsightReqRef.current = requestId

    try {
      const result = await invokeDb<FileInsight>('ai:file:insight', activeProjectId, filePath)
      if (fileInsightReqRef.current !== requestId) return
      setFileInsight(result)
    } catch (error) {
      if (fileInsightReqRef.current !== requestId) return
      const message = (error as { message?: string })?.message ?? 'Could not analyze this file.'
      setFileInsightError(message)
    } finally {
      if (fileInsightReqRef.current === requestId) {
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
          onSelectProject={setActiveProject}
          onRemoveProject={handleRemoveProject}
          onAddProject={handleAddProject}
          onToggleTheme={handleToggleTheme}
          onToggleMode={handleToggleMode}
          projectStates={projectStates}
          githubSlot={
            <GitHubStatus
              connected={tokenExists === true}
              onConnect={() => {
                setShowAiPanel(false)
                setShowGitHubPanel(true)
              }}
              onDisconnect={clearToken}
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
              {(showAiPanel || showProjectSettingsPanel) && (
                <div className={styles.panelArea}>
                  {showAiPanel && (
                    <ConnectAI
                      connectionStatus={connectionStatus}
                      onConnect={handleConnectAi}
                      onDisconnect={disconnect}
                      onOpenProviderDocs={handleOpenAiDocs}
                      onSelectModel={setModel}
                    />
                  )}
                  {showProjectSettingsPanel && (
                    <ProjectSettingsPanel
                      aiSettings={projectAiSettings}
                      aiConnectionStatus={connectionStatus.connection_status}
                      selectedModel={connectionStatus.selected_model}
                      cloudTarget={cloudSetup.target}
                      onAiChange={(patch) => {
                        void handleProjectAiChange(patch)
                      }}
                      onOpenAiConnection={() => setShowAiPanel(true)}
                      onOpenCloudSetup={() => {
                        void cloudSetup.open(false)
                      }}
                      onClose={() => setShowProjectSettingsPanel(false)}
                    />
                  )}
                </div>
              )}

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
                <button
                  className={styles.settingsBtn}
                  onClick={() => setShowProjectSettingsPanel((value) => !value)}
                >
                  Project Settings
                </button>
                {status && (status.ahead > 0 || status.behind > 0) && (
                  <span className={styles.aheadBehind}>
                    {status.ahead > 0 && <span>↑ {status.ahead}</span>}
                    {status.behind > 0 && <span>↓ {status.behind}</span>}
                  </span>
                )}
              </header>

              {isNotARepo ? (
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

              <ActionPanel
                status={status}
                loading={actionLoading}
                error={isNotARepo ? null : actionError}
                messageTemplate={preferences.default_save_message_template}
                tokenExists={tokenExists}
                cloudUploadReady={cloudSetup.cloudUploadReady}
                cloudStatusLabel={cloudSetup.cloudStatusLabel}
                aiAutoSaveEnabled={projectAiSettings.auto_save_message_enabled}
                aiConnectionReady={
                  connectionStatus.connection_status === 'connected' &&
                  Boolean(connectionStatus.selected_model)
                }
                forceShowConnect={showGitHubPanel}
                deviceFlow={deviceFlow}
                naturalUndoEnabled={manualAiToolsEnabled && !isNotARepo}
                naturalUndoSuggestion={naturalUndoSuggestion}
                naturalUndoLoading={naturalUndoLoading}
                naturalUndoApplying={naturalUndoApplying}
                naturalUndoError={naturalUndoError}
                onCommit={commit}
                onPush={handleUpload}
                onPull={handlePullRequest}
                onOpenCloudSetup={() => {
                  void cloudSetup.open(true)
                }}
                onClearError={clearError}
                onConnectGitHub={handleConnectGitHub}
                onOpenGitHubDocs={handleOpenGitHubDocs}
                onOpenDevicePage={handleOpenDevicePage}
                onStartDeviceFlow={startDeviceFlow}
                onCancelDeviceFlow={cancelDeviceFlow}
                onGenerateAutoMessage={generateAutoMessage}
                onSuggestNaturalUndo={handleSuggestNaturalUndo}
                onApplyNaturalUndo={handleApplyNaturalUndo}
              />
            </>
          ) : showAiPanel ? (
            <div className={styles.emptyMain}>
              <ConnectAI
                connectionStatus={connectionStatus}
                onConnect={handleConnectAi}
                onDisconnect={disconnect}
                onOpenProviderDocs={handleOpenAiDocs}
                onSelectModel={setModel}
              />
            </div>
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
            onClose={() => setShowPullUpdatesDialog(false)}
            onConfirmPull={handleConfirmPullFromDialog}
          />
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
