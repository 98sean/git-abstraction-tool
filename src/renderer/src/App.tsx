import { useEffect, useMemo, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { invokeDb } from './ipc'
import { useAuth } from './hooks/useAuth'
import { useFileStatus } from './hooks/useFileStatus'
import { useGitActions } from './hooks/useGitActions'
import { usePreferences } from './hooks/usePreferences'
import { useProjects } from './hooks/useProjects'
import { useToast } from './hooks/useToast'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { FileManager } from './components/FileManager/FileManager'
import { Sidebar, pickFolder } from './components/Sidebar/Sidebar'
import { ConnectGitHub, GitHubStatus } from './components/ConnectGitHub/ConnectGitHub'
import { ToastContainer } from './components/shared/Toast'
import { AiCommitSuggestion, CommitAiMetadata } from './types'
import styles from './App.module.css'

function Shell(): JSX.Element {
  const { projects, activeProjectId, activeProject, addProject, removeProject, setActiveProject } =
    useProjects()
  const { preferences, setPreference } = usePreferences()
  const { addToast } = useToast()
  const { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow } = useAuth()
  const [showGitHubPanel, setShowGitHubPanel] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<AiCommitSuggestion | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const { status, loading: statusLoading, error: statusError, fetchStatus, stage, unstage, stageAll, unstageAll, revertFile } =
    useFileStatus(activeProjectId)

  const { loading: actionLoading, error: actionError, commit, push, pull, clearError } =
    useGitActions(activeProjectId)

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
      addToast('AI suggested a save message. Review it, then click Save Progress again.', 'info')
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

    fetchStatus()
    addToast('Saved successfully!', 'success')
    setCommitMessage('')
    setAiSuggestion(null)
  }

  const handleOpenGitHubDocs = (): void => {
    invokeDb('shell:openExternal', 'https://github.com/settings/tokens').catch(console.error)
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
              aiLoading={aiLoading}
              error={actionError}
              message={commitMessage}
              tokenExists={tokenExists}
              forceShowConnect={showGitHubPanel}
              deviceFlow={deviceFlow}
              onMessageChange={setCommitMessage}
              onCommit={handleCommit}
              onSuggestMessage={handleSuggestCommitMessage}
              onPush={async () => {
                const pushed = await push()
                if (pushed) addToast('Uploaded to cloud', 'success')
              }}
              onPull={async () => {
                const pulled = await pull()
                if (!pulled) return
                fetchStatus()
                addToast('Updates downloaded', 'success')
              }}
              onClearError={clearError}
              onConnectGitHub={handleConnectGitHub}
              onOpenGitHubDocs={handleOpenGitHubDocs}
              onStartDeviceFlow={startDeviceFlow}
              onCancelDeviceFlow={cancelDeviceFlow}
            />
          </>
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
