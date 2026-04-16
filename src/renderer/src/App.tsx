import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useAiConnection } from './hooks/useAiConnection'
import { useCloudSetup } from './hooks/useCloudSetup'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { useAutoSaveMessage } from './hooks/useAutoSaveMessage'
import { usePreferences } from './hooks/usePreferences'
import { useProjectAiSettings } from './hooks/useProjectAiSettings'
import { useProjects } from './hooks/useProjects'
import { useProjectLinkWizard } from './hooks/useProjectLinkWizard'
import { useToast } from './hooks/useToast'
import { AIConsentDialog } from './components/AIConsentDialog/AIConsentDialog'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { AIStatus, ConnectAI } from './components/ConnectAI/ConnectAI'
import { CloudSetupWizard } from './components/CloudSetupWizard/CloudSetupWizard'
import { FileManager } from './components/FileManager/FileManager'
import { DangerZoneUploadDialog } from './components/DangerZoneUploadDialog/DangerZoneUploadDialog'
import { ProjectLinkWizard } from './components/ProjectLinkWizard/ProjectLinkWizard'
import { ProjectSettingsPanel } from './components/ProjectSettingsPanel/ProjectSettingsPanel'
import { Sidebar } from './components/Sidebar/Sidebar'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { ToastContainer } from './components/shared/Toast'
import { ProjectAiSettings, ProjectCloudTarget, PushToCloudOptions } from './types'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, removeProject, setActiveProject } =
    useProjects()
  const { preferences, setPreference } = usePreferences()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const { connectionStatus, connect, disconnect, setModel } = useAiConnection()
  const { settings: projectAiSettings, updateSettings: updateProjectAiSettings } = useProjectAiSettings(activeProjectId)
  const { generate: generateAutoMessage } = useAutoSaveMessage(activeProjectId)
  const linkWizard = useProjectLinkWizard({
    onLinked: (project) => addToast(`"${project.friendly_name}" linked successfully`, 'success')
  })
  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showProjectSettingsPanel, setShowProjectSettingsPanel] = useState(false)
  const [showAiConsentDialog, setShowAiConsentDialog] = useState(false)
  const [pendingDangerTarget, setPendingDangerTarget] = useState<ProjectCloudTarget | null>(null)

  const { status, loading: statusLoading, error: statusError, fetchStatus, stage, unstage, stageAll, unstageAll, revertFile } =
    useFileStatus(activeProjectId)

  const { loading: actionLoading, error: actionError, commit, push, pull, clearError } =
    useGitActions(activeProjectId, () => {
      fetchStatus()
      addToast('Saved successfully!', 'success')
    })

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
    addToast('Uploaded to cloud', 'success')
  }

  const cloudSetup = useCloudSetup(activeProject, {
    onReadyToUpload: handleUploadWithTarget
  })

  const handleAddProject = (): void => {
    linkWizard.open()
  }

  const handleRemoveProject = async (project_id: string): Promise<void> => {
    const project = projects.find((p) => p.project_id === project_id)
    if (!window.confirm(`Remove "${project?.friendly_name}" from your projects?`)) return
    await removeProject(project_id)
    addToast('Project removed', 'info')
  }

  const handleToggleTheme = (): void => {
    setPreference('theme', preferences.theme === 'light' ? 'dark' : 'light')
  }

  const handleOpenGitHubDocs = (): void => {
    invokeDb('shell:openExternal', 'https://github.com/settings/tokens').catch(console.error)
  }

  const handleOpenAiDocs = (provider: 'openai' | 'anthropic'): void => {
    const url =
      provider === 'openai'
        ? 'https://developers.openai.com/api/'
        : 'https://platform.claude.com/docs/api-reference'

    invokeDb('shell:openExternal', url).catch(console.error)
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
    if (!activeProject) {
      return
    }

    if (cloudSetup.target.mode === 'none') {
      await cloudSetup.open(true)
      return
    }

    await handleUploadWithTarget(cloudSetup.target, options)
  }

  const projectStates = Object.fromEntries(
    projects.map((p) => {
      if (p.project_id === activeProjectId && status) {
        return [p.project_id, status.is_clean ? 'clean' : 'changed'] as const
      }
      return [p.project_id, 'unknown'] as const
    })
  ) as Record<string, 'changed' | 'clean' | 'unknown'>

  return (
    <div className={styles.app}>
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        theme={preferences.theme}
        onSelectProject={setActiveProject}
        onRemoveProject={handleRemoveProject}
        onAddProject={handleAddProject}
        onToggleTheme={handleToggleTheme}
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
                <span className={styles.branch}>
                  🌿 {status.current_branch}
                </span>
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

            <FileManager
              status={status}
              loading={statusLoading}
              error={statusError}
              onStage={stage}
              onUnstage={unstage}
              onStageAll={stageAll}
              onUnstageAll={unstageAll}
              onRevert={revertFile}
            />

            <ActionPanel
              status={status}
              loading={actionLoading}
              error={actionError}
              messageTemplate={preferences.default_save_message_template}
              tokenExists={tokenExists}
              cloudUploadReady={cloudSetup.cloudUploadReady}
              cloudStatusLabel={cloudSetup.cloudStatusLabel}
              forceShowConnect={showGitHubPanel}
              deviceFlow={deviceFlow}
              onCommit={commit}
              onPush={handleUpload}
              onPull={async () => { await pull(); fetchStatus(); addToast('Updates downloaded', 'success') }}
              onOpenCloudSetup={() => { void cloudSetup.open(true) }}
              onClearError={clearError}
              onConnectGitHub={handleConnectGitHub}
              onOpenGitHubDocs={handleOpenGitHubDocs}
              onStartDeviceFlow={startDeviceFlow}
              onCancelDeviceFlow={cancelDeviceFlow}
              aiAutoSaveEnabled={projectAiSettings.auto_save_message_enabled}
              aiConnectionReady={
                connectionStatus.connection_status === 'connected' &&
                Boolean(connectionStatus.selected_model)
              }
              onGenerateAutoMessage={generateAutoMessage}
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
              onOpenGitHub={handleOpenGitHubDocs}
              deviceFlow={deviceFlow}
              onStartDeviceFlow={startDeviceFlow}
              onCancelDeviceFlow={cancelDeviceFlow}
            />
          </div>
        ) : (
          <div className={styles.emptyMain}>
            <div className={styles.emptyIcon}>📁</div>
            <h2>Welcome</h2>
            <p>Link a project folder from the sidebar to start managing your files.</p>
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
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
