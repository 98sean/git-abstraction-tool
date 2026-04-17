import { useState } from 'react'
import { GitError, GitStatus, NaturalUndoSuggestion } from '../../types'
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
  naturalUndoEnabled: boolean
  naturalUndoSuggestion: NaturalUndoSuggestion | null
  naturalUndoLoading: boolean
  naturalUndoApplying: boolean
  naturalUndoError: string | null
  onCommit: (message: string) => void
  onPush: () => void
  onPull: () => void
  onClearError: () => void
  onSuggestNaturalUndo: (query: string) => Promise<void>
  onApplyNaturalUndo: () => Promise<void>
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
  naturalUndoEnabled,
  naturalUndoSuggestion,
  naturalUndoLoading,
  naturalUndoApplying,
  naturalUndoError,
  onCommit,
  onPush,
  onPull,
  onClearError,
  onSuggestNaturalUndo,
  onApplyNaturalUndo,
  onConnectGitHub,
  onOpenGitHubDocs,
  onOpenDevicePage,
  onStartDeviceFlow,
  onCancelDeviceFlow
}: Props): JSX.Element {
  const t = useTerms()
  const [message, setMessage] = useState(messageTemplate)
  const [undoQuery, setUndoQuery] = useState('')

  const stagedCount = status?.files.filter((f) => f.staged).length ?? 0
  const canCommit = stagedCount > 0 && message.trim().length > 0 && !loading
  const canSuggestUndo =
    naturalUndoEnabled &&
    undoQuery.trim().length > 0 &&
    !naturalUndoLoading &&
    !naturalUndoApplying &&
    !loading
  const canApplyUndo =
    !!naturalUndoSuggestion &&
    !naturalUndoLoading &&
    !naturalUndoApplying &&
    !loading

  const handleCommit = (): void => {
    if (!canCommit) return
    onCommit(message.trim())
    setMessage('')
  }

  const handleSuggestUndo = async (): Promise<void> => {
    if (!canSuggestUndo) return
    await onSuggestNaturalUndo(undoQuery.trim())
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

      <div className={styles.undoPanel}>
        <div className={styles.undoHeader}>
          <span className={styles.undoTitle}>Natural Language Undo</span>
          {!naturalUndoEnabled && <span className={styles.undoHint}>OpenAI key required</span>}
        </div>

        <div className={styles.undoInputRow}>
          <input
            className={styles.undoInput}
            value={undoQuery}
            onChange={(e) => setUndoQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSuggestUndo()
              }
            }}
            placeholder='Example: "Restore to yesterday afternoon before the red button removal"'
            disabled={!naturalUndoEnabled || naturalUndoApplying}
          />
          <button
            className={styles.undoSuggestBtn}
            onClick={() => void handleSuggestUndo()}
            disabled={!canSuggestUndo}
          >
            {naturalUndoLoading ? 'Analyzing...' : 'Find Point'}
          </button>
        </div>

        {naturalUndoError && <div className={styles.undoError}>{naturalUndoError}</div>}

        {naturalUndoSuggestion && (
          <div className={styles.undoSuggestion}>
            <div className={styles.undoProposal}>{naturalUndoSuggestion.proposal_text}</div>
            <div className={styles.undoSuggestionTitle}>
              <strong>{naturalUndoSuggestion.short_hash}</strong>
              <span>{naturalUndoSuggestion.commit_message}</span>
            </div>
            <div className={styles.undoMeta}>
              <span>{new Date(naturalUndoSuggestion.commit_date).toLocaleString()}</span>
              <span>Confidence {(naturalUndoSuggestion.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.undoReason}>{naturalUndoSuggestion.reason}</div>

            <div className={styles.undoPreview}>
              <span>Restore {naturalUndoSuggestion.total_restore_files} files</span>
              <span>Remove {naturalUndoSuggestion.total_remove_files} files</span>
            </div>

            {naturalUndoSuggestion.restore_files_preview.length > 0 && (
              <div className={styles.undoFileList}>
                {naturalUndoSuggestion.restore_files_preview.map((path) => (
                  <div key={`restore:${path}`}>Restore: {path}</div>
                ))}
              </div>
            )}

            {naturalUndoSuggestion.remove_files_preview.length > 0 && (
              <div className={styles.undoFileList}>
                {naturalUndoSuggestion.remove_files_preview.map((path) => (
                  <div key={`remove:${path}`}>Remove: {path}</div>
                ))}
              </div>
            )}

            <button
              className={styles.undoApplyBtn}
              onClick={() => void onApplyNaturalUndo()}
              disabled={!canApplyUndo}
            >
              {naturalUndoApplying ? 'Restoring...' : 'Yes, Restore This Point'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
