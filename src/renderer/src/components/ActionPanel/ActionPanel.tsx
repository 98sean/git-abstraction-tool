import { useState } from 'react'
import { GitError, GitStatus } from '../../types'
import { ConnectGitHub } from '../ConnectGitHub/ConnectGitHub'
import { Spinner } from '../shared/Spinner'
import styles from './ActionPanel.module.css'

interface Props {
  status: GitStatus | null
  loading: boolean
  error: GitError | null
  messageTemplate: string
  tokenExists: boolean | null
  forceShowConnect?: boolean
  onCommit: (message: string) => void
  onPush: () => void
  onPull: () => void
  onClearError: () => void
  onConnectGitHub: (token: string) => Promise<void>
  onOpenGitHubDocs: () => void
}

export function ActionPanel({
  status,
  loading,
  error,
  messageTemplate,
  tokenExists,
  forceShowConnect = false,
  onCommit,
  onPush,
  onPull,
  onClearError,
  onConnectGitHub,
  onOpenGitHubDocs
}: Props): JSX.Element {
  const [message, setMessage] = useState(messageTemplate)

  const stagedCount = status?.files.filter((f) => f.staged).length ?? 0
  const canCommit = stagedCount > 0 && message.trim().length > 0 && !loading

  const handleCommit = (): void => {
    if (!canCommit) return
    onCommit(message.trim())
    setMessage('')
  }

  return (
    <div className={styles.panel}>
      {/* Show GitHub connect prompt when auth fails, no token is stored, or sidebar button was clicked */}
      {(error?.code === 'AUTH_FAILED' || tokenExists === false || forceShowConnect) && (
        <ConnectGitHub onConnect={onConnectGitHub} onOpenGitHub={onOpenGitHubDocs} />
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
          onChange={(e) => setMessage(e.target.value)}
          placeholder={stagedCount > 0 ? 'Describe what you saved…' : 'Select changes above to save'}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommit()
          }}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleCommit} disabled={!canCommit}>
          {loading ? <Spinner size={14} /> : null}
          {loading ? 'Saving…' : `Save Progress${stagedCount > 0 ? ` (${stagedCount})` : ''}`}
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
