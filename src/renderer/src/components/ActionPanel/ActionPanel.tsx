import { useState } from 'react'
import { GitError, GitStatus } from '../../types'
import { DeviceFlowState } from '../../hooks/useAuth'
import { useTerms } from '../../hooks/useTerms'
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
  deviceFlow: DeviceFlowState | null
  onCommit: (message: string) => void
  onPush: () => void
  onPull: () => void
  onClearError: () => void
  onConnectGitHub: (token: string) => Promise<void>
  onOpenGitHubDocs: () => void
  onOpenDevicePage: () => void
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
}

export function ActionPanel({
  status,
  loading,
  error,
  messageTemplate,
  tokenExists,
  forceShowConnect = false,
  deviceFlow,
  onCommit,
  onPush,
  onPull,
  onClearError,
  onConnectGitHub,
  onOpenGitHubDocs,
  onOpenDevicePage,
  onStartDeviceFlow,
  onCancelDeviceFlow
}: Props): JSX.Element {
  const t = useTerms()
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
        <ConnectGitHub
          onConnect={onConnectGitHub}
          onOpenGitHubDocs={onOpenGitHubDocs}
          onOpenDevicePage={onOpenDevicePage}
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
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.commitPlaceholder(stagedCount > 0)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommit()
          }}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleCommit} disabled={!canCommit}>
          {loading ? <Spinner size={14} /> : null}
          {loading ? t.committingBtn : t.commitBtn(stagedCount)}
        </button>

        <button
          className={styles.syncBtn}
          onClick={onPull}
          disabled={loading || !status}
          title={t.pullTitle}
        >
          {t.pullBtn}
        </button>

        <button
          className={styles.syncBtn}
          onClick={onPush}
          disabled={loading || !status}
          title={t.pushTitle}
        >
          {t.pushBtn}
          {(status?.ahead ?? 0) > 0 && (
            <span className={styles.aheadBehind}>{status!.ahead}</span>
          )}
        </button>
      </div>

      {status && (
        <div className={styles.statusBar}>
          <span>{t.filesStaged(stagedCount)}</span>
          {status.ahead > 0 && (
            <span className={styles.syncIndicator}>{t.toPush(status.ahead)}</span>
          )}
          {status.behind > 0 && (
            <span className={styles.syncIndicator}>{t.toPull(status.behind)}</span>
          )}
          {status.has_conflicts && (
            <span style={{ color: 'var(--status-conflicted)' }}>{t.conflictMsg}</span>
          )}
        </div>
      )}
    </div>
  )
}
