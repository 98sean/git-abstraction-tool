import { useState } from 'react'
import { DeviceFlowState } from '../../hooks/useAuth'
import { useTerms } from '../../hooks/useTerms'
import { GitError, GitStatus, NaturalUndoSuggestion, PushToCloudOptions } from '../../types'
import { ConnectGitHub } from '../ConnectGitHub/ConnectGitHub'
import { Spinner } from '../shared/Spinner'
import styles from './ActionPanel.module.css'

interface Props {
  status: GitStatus | null
  loading: boolean
  error: GitError | null
  messageTemplate: string
  tokenExists: boolean | null
  cloudUploadReady: boolean
  cloudStatusLabel?: string
  aiAutoSaveEnabled?: boolean
  aiConnectionReady?: boolean
  forceShowConnect?: boolean
  deviceFlow: DeviceFlowState | null
  naturalUndoEnabled?: boolean
  naturalUndoSuggestion?: NaturalUndoSuggestion | null
  naturalUndoLoading?: boolean
  naturalUndoApplying?: boolean
  naturalUndoError?: string | null
  onCommit: (message: string) => void
  onPush: (options?: PushToCloudOptions) => void
  onPull: () => void
  onOpenCloudSetup: () => void
  onClearError: () => void
  onConnectGitHub: (token: string) => Promise<void>
  onOpenGitHubDocs: () => void
  onOpenDevicePage: () => void
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
  onGenerateAutoMessage?: () => Promise<string | null>
  onSuggestNaturalUndo?: (query: string) => Promise<void>
  onApplyNaturalUndo?: () => Promise<void>
}

export function ActionPanel({
  status,
  loading,
  error,
  messageTemplate,
  tokenExists,
  cloudUploadReady,
  cloudStatusLabel,
  aiAutoSaveEnabled = false,
  aiConnectionReady = false,
  forceShowConnect = false,
  deviceFlow,
  naturalUndoEnabled = false,
  naturalUndoSuggestion = null,
  naturalUndoLoading = false,
  naturalUndoApplying = false,
  naturalUndoError = null,
  onCommit,
  onPush,
  onPull,
  onOpenCloudSetup,
  onClearError,
  onConnectGitHub,
  onOpenGitHubDocs,
  onOpenDevicePage,
  onStartDeviceFlow,
  onCancelDeviceFlow,
  onGenerateAutoMessage,
  onSuggestNaturalUndo,
  onApplyNaturalUndo
}: Props): JSX.Element {
  const t = useTerms()
  const [message, setMessage] = useState(messageTemplate)
  const [helperText, setHelperText] = useState<string | null>(null)
  const [draftingAiMessage, setDraftingAiMessage] = useState(false)
  const [undoQuery, setUndoQuery] = useState('')

  const stagedCount = status?.files.filter((file) => file.staged).length ?? 0
  const shouldGenerateAiDraft =
    aiAutoSaveEnabled &&
    aiConnectionReady &&
    stagedCount > 0 &&
    message.trim().length === 0 &&
    Boolean(onGenerateAutoMessage)

  const canCommit =
    stagedCount > 0 &&
    !loading &&
    !draftingAiMessage &&
    (message.trim().length > 0 || shouldGenerateAiDraft)

  const canSuggestUndo =
    naturalUndoEnabled &&
    undoQuery.trim().length > 0 &&
    !naturalUndoLoading &&
    !naturalUndoApplying &&
    !loading &&
    Boolean(onSuggestNaturalUndo)

  const canApplyUndo =
    Boolean(naturalUndoSuggestion) &&
    !naturalUndoLoading &&
    !naturalUndoApplying &&
    !loading &&
    Boolean(onApplyNaturalUndo)

  const handleCommit = async (): Promise<void> => {
    if (!canCommit) return

    if (shouldGenerateAiDraft && onGenerateAutoMessage) {
      setDraftingAiMessage(true)

      try {
        const suggestion = await onGenerateAutoMessage()

        if (suggestion) {
          setMessage(suggestion)
          setHelperText('AI drafted a save message. Review it, then click Save Progress again.')
          return
        }

        setHelperText('AI could not draft a save message. Enter one manually to continue.')
        return
      } finally {
        setDraftingAiMessage(false)
      }
    }

    onCommit(message.trim())
    setMessage('')
    setHelperText(null)
  }

  const handlePush = (): void => {
    if (!cloudUploadReady) {
      onOpenCloudSetup()
      return
    }

    onPush()
  }

  const handleSuggestUndo = async (): Promise<void> => {
    if (!canSuggestUndo || !onSuggestNaturalUndo) return
    await onSuggestNaturalUndo(undoQuery.trim())
  }

  return (
    <div className={styles.panel}>
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
          onChange={(event) => {
            setMessage(event.target.value)
            setHelperText(null)
          }}
          placeholder={t.commitPlaceholder(stagedCount > 0)}
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              void handleCommit()
            }
          }}
        />
      </div>

      {helperText && <div className={styles.helperText}>{helperText}</div>}

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          onClick={() => {
            void handleCommit()
          }}
          disabled={!canCommit}
        >
          {loading || draftingAiMessage ? <Spinner size={14} /> : null}
          {draftingAiMessage ? 'Drafting…' : loading ? t.committingBtn : t.commitBtn(stagedCount)}
        </button>

        <button className={styles.syncBtn} onClick={onPull} disabled={loading || !status} title={t.pullTitle}>
          {t.pullBtn}
        </button>

        <button className={styles.syncBtn} onClick={handlePush} disabled={loading || !status} title={t.pushTitle}>
          {t.pushBtn}
          {(status?.ahead ?? 0) > 0 && <span className={styles.aheadBehind}>{status!.ahead}</span>}
        </button>
      </div>

      {status && (
        <div className={styles.statusBar}>
          <span>{t.filesStaged(stagedCount)}</span>
          {cloudStatusLabel && (
            <span className={`${styles.cloudHint} ${!cloudUploadReady ? styles.pendingCloud : ''}`}>
              {cloudStatusLabel}
            </span>
          )}
          {status.ahead > 0 && <span className={styles.syncIndicator}>{t.toPush(status.ahead)}</span>}
          {status.behind > 0 && <span className={styles.syncIndicator}>{t.toPull(status.behind)}</span>}
          {status.has_conflicts && <span style={{ color: 'var(--status-conflicted)' }}>{t.conflictMsg}</span>}
        </div>
      )}

      <div className={styles.undoPanel}>
        <div className={styles.undoHeader}>
          <span className={styles.undoTitle}>Natural Language Undo</span>
          {!naturalUndoEnabled && <span className={styles.undoHint}>OpenAI connection required</span>}
        </div>

        <div className={styles.undoInputRow}>
          <input
            className={styles.undoInput}
            value={undoQuery}
            onChange={(event) => setUndoQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSuggestUndo()
              }
            }}
            placeholder='Example: "Restore to yesterday afternoon before the red button removal"'
            disabled={!naturalUndoEnabled || naturalUndoApplying}
          />
          <button
            className={styles.undoSuggestBtn}
            onClick={() => {
              void handleSuggestUndo()
            }}
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
                {naturalUndoSuggestion.restore_files_preview.map((filePath) => (
                  <div key={`restore:${filePath}`}>Restore: {filePath}</div>
                ))}
              </div>
            )}

            {naturalUndoSuggestion.remove_files_preview.length > 0 && (
              <div className={styles.undoFileList}>
                {naturalUndoSuggestion.remove_files_preview.map((filePath) => (
                  <div key={`remove:${filePath}`}>Remove: {filePath}</div>
                ))}
              </div>
            )}

            <button
              className={styles.undoApplyBtn}
              onClick={() => {
                if (onApplyNaturalUndo) {
                  void onApplyNaturalUndo()
                }
              }}
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
