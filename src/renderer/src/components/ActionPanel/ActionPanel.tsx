import { GitError, GitStatus } from '../../types'
import { DeviceFlowState } from '../../hooks/useAuth'
import { ConnectGitHub } from '../ConnectGitHub/ConnectGitHub'
import { Spinner } from '../shared/Spinner'
import styles from './ActionPanel.module.css'

interface Props {
  status: GitStatus | null
  loading: boolean
  aiLoading: boolean
  error: GitError | null
  message: string
  tokenExists: boolean | null
  forceShowConnect?: boolean
  deviceFlow: DeviceFlowState | null
  onMessageChange: (message: string) => void
  onCommit: () => void
  onSuggestMessage: () => void
  onPush: () => void
  onPull: () => void
  onClearError: () => void
  onConnectGitHub: (token: string) => Promise<void>
  onOpenGitHubDocs: () => void
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
}

export function ActionPanel({
  status,
  loading,
  aiLoading,
  error,
  message,
  tokenExists,
  forceShowConnect = false,
  deviceFlow,
  onMessageChange,
  onCommit,
  onSuggestMessage,
  onPush,
  onPull,
  onClearError,
  onConnectGitHub,
  onOpenGitHubDocs,
  onStartDeviceFlow,
  onCancelDeviceFlow
}: Props): JSX.Element {
  const stagedCount = status?.files.filter((f) => f.staged).length ?? 0
  const canCommit = stagedCount > 0 && !loading && !aiLoading
  const canSuggest = stagedCount > 0 && !loading && !aiLoading

  const handleCommit = (): void => {
    if (!canCommit) return
    onCommit()
  }

  return (
    <div className={styles.panel}>
      {/* Show GitHub connect prompt when auth fails, no token is stored, or sidebar button was clicked */}
      {(error?.code === 'AUTH_FAILED' || tokenExists === false || forceShowConnect) && (
        <ConnectGitHub
          onConnect={onConnectGitHub}
          onOpenGitHub={onOpenGitHubDocs}
          deviceFlow={deviceFlow}
          onStartDeviceFlow={onStartDeviceFlow}
          onCancelDeviceFlow={onCancelDeviceFlow}
        />
      )}

      {error && error.code !== 'AUTH_FAILED' && (
        <div className={styles.errorBanner}>
          <span>{error.message}</span>
          <button className={styles.dismissBtn} onClick={onClearError} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <div className={styles.messageRow}>
        <textarea
          className={styles.messageInput}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={stagedCount > 0 ? 'Describe what you saved…' : 'Select changes above to save'}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommit()
          }}
        />
        <button
          className={styles.suggestBtn}
          onClick={onSuggestMessage}
          disabled={!canSuggest}
          title="Use AI to suggest a save message"
        >
          {aiLoading ? <Spinner size={14} /> : 'AI Suggest'}
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleCommit} disabled={!canCommit}>
          {loading || aiLoading ? <Spinner size={14} /> : null}
          {loading ? 'Saving…' : aiLoading ? 'Thinking…' : `Save Progress${stagedCount > 0 ? ` (${stagedCount})` : ''}`}
        </button>

        <button
          className={styles.syncBtn}
          onClick={onPull}
          disabled={loading || !status}
          title="Get latest updates from cloud"
        >
          ↓ Get Updates
        </button>

        <button
          className={styles.syncBtn}
          onClick={onPush}
          disabled={loading || !status}
          title="Upload your saved versions to cloud"
        >
          ↑ Upload to Cloud
          {(status?.ahead ?? 0) > 0 && (
            <span className={styles.aheadBehind}>{status!.ahead}</span>
          )}
        </button>
      </div>

      {status && (
        <div className={styles.statusBar}>
          <span>{stagedCount} change{stagedCount !== 1 ? 's' : ''} selected</span>
          {status.ahead > 0 && (
            <span className={styles.syncIndicator}>
              ↑ {status.ahead} to upload
            </span>
          )}
          {status.behind > 0 && (
            <span className={styles.syncIndicator}>
              ↓ {status.behind} to download
            </span>
          )}
          {status.has_conflicts && (
            <span style={{ color: 'var(--status-conflicted)' }}>
              ⚠ Version mismatch detected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
