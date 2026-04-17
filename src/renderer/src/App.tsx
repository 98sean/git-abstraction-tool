import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useApiKeys } from './hooks/useApiKeys'
import { useTerms } from './hooks/useTerms'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjects } from './hooks/useProjects'
import { useToast } from './hooks/useToast'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { ApiKeySettings } from './components/ApiKeySettings/ApiKeySettings'
import { FileManager } from './components/FileManager/FileManager'
import { Sidebar, pickFolder } from './components/Sidebar/Sidebar'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { ToastContainer } from './components/shared/Toast'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, addProject, removeProject, setActiveProject } =
    useProjects()
  const { preferences, setPreference } = usePreferences()
  const t = useTerms()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const { keys: apiKeys, setOpenAIKey, setAnthropicKey, clearOpenAIKey, clearAnthropicKey } = useApiKeys()
  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { status, loading: statusLoading, error: statusError, fetchStatus, stage, unstage, stageAll, unstageAll, revertFile } =
    useFileStatus(activeProjectId)

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
                <span className={styles.branch}>
                  🌿 {status.current_branch}
                </span>
              )}
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
              forceShowConnect={showGitHubPanel}
              deviceFlow={deviceFlow}
              onCommit={commit}
              onPush={async () => { await push(); addToast(t.pushedToast, 'success') }}
              onPull={async () => { await pull(); fetchStatus(); addToast(t.pulledToast, 'success') }}
              onClearError={clearError}
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
          onSaveOpenAI={setOpenAIKey}
          onSaveAnthropic={setAnthropicKey}
          onClearOpenAI={clearOpenAIKey}
          onClearAnthropic={clearAnthropicKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ToastContainer />
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
