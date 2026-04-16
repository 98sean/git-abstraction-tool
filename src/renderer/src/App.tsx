import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useAiConnection } from './hooks/useAiConnection'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjects } from './hooks/useProjects'
import { useToast } from './hooks/useToast'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { AIStatus, ConnectAI } from './components/ConnectAI/ConnectAI'
import { FileManager } from './components/FileManager/FileManager'
import { Sidebar, pickFolder } from './components/Sidebar/Sidebar'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { ToastContainer } from './components/shared/Toast'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, addProject, removeProject, setActiveProject } =
    useProjects()
  const { preferences, setPreference } = usePreferences()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const { connectionStatus, connect, disconnect, setModel } = useAiConnection()
  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

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

  const handleAddProject = async (): Promise<void> => {
    const folderPath = await pickFolder()
    if (!folderPath) return
    const parts = folderPath.replace(/\\/g, '/').split('/')
    const projectName = parts[parts.length - 1] || 'My Project'
    try {
      await addProject(folderPath, projectName)
      addToast(`"${projectName}" linked successfully`, 'success')
    } catch {
      addToast('Could not link that folder. Please try again.', 'error')
    }
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
            {showAiPanel && (
              <div className={styles.panelArea}>
                <ConnectAI
                  connectionStatus={connectionStatus}
                  onConnect={handleConnectAi}
                  onDisconnect={disconnect}
                  onOpenProviderDocs={handleOpenAiDocs}
                  onSelectModel={setModel}
                />
              </div>
            )}
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
              onPush={async () => { await push(); addToast('Uploaded to cloud', 'success') }}
              onPull={async () => { await pull(); fetchStatus(); addToast('Updates downloaded', 'success') }}
              onClearError={clearError}
              onConnectGitHub={handleConnectGitHub}
              onOpenGitHubDocs={handleOpenGitHubDocs}
              onStartDeviceFlow={startDeviceFlow}
              onCancelDeviceFlow={cancelDeviceFlow}
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
