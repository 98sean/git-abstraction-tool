import { useState } from 'react'
import { useTerms } from '../../hooks/useTerms'
import { GitError, GitStatus, NaturalUndoSuggestion, PushConfiguredTargetResult } from '../../types'
import { Spinner } from '../shared/Spinner'
import styles from './ActionPanel.module.css'

interface Props {
  status: GitStatus | null
  loading: boolean
  aiLoading: boolean
  error: GitError | null
  message: string
  tokenExists: boolean | null
  cloudUploadReady: boolean
  cloudStatusLabel?: string
  uploadHandoff?: PushConfiguredTargetResult | null
  aiAutoSaveEnabled?: boolean
  aiConnectionReady?: boolean
  naturalUndoEnabled: boolean
  naturalUndoSuggestion: NaturalUndoSuggestion | null
  naturalUndoLoading: boolean
  naturalUndoApplying: boolean
  naturalUndoError: string | null
  onMessageChange: (message: string) => void
  onCommit: () => void
  onSuggestMessage: () => void
  onPush: () => void
  onPull: () => void
  onOpenCloudSetup: () => void
  onClearError: () => void
  onOpenGitHubConnect: () => void
  onGenerateAutoMessage?: () => Promise<string | null>
  onSuggestNaturalUndo?: (query: string) => Promise<void>
  onApplyNaturalUndo?: () => Promise<void>
  onCancelNaturalUndo?: () => void
  /**
   * Pick one of the alternative candidates the AI returned. The handler in
   * App.tsx should promote that alternative into `primary` so the rest of the
   * proposal UI (preview, Yes-Restore button) re-renders against it.
   */
  onSelectNaturalUndoAlternative?: (alternativeIndex: number) => void
}

export function ActionPanel({
  status,
  loading,
  aiLoading,
  error,
  message,
  tokenExists,
  cloudUploadReady,
  cloudStatusLabel,
  uploadHandoff = null,
  aiAutoSaveEnabled = false,
  aiConnectionReady = false,
  naturalUndoEnabled,
  naturalUndoSuggestion,
  naturalUndoLoading,
  naturalUndoApplying,
  naturalUndoError,
  onMessageChange,
  onCommit,
  onSuggestMessage,
  onPush,
  onPull,
  onOpenCloudSetup,
  onClearError,
  onOpenGitHubConnect,
  onGenerateAutoMessage,
  onSuggestNaturalUndo,
  onApplyNaturalUndo,
  onCancelNaturalUndo,
  onSelectNaturalUndoAlternative
}: Props): JSX.Element {
  const t = useTerms()
  const [helperText, setHelperText] = useState<string | null>(null)
  const [draftingAiMessage, setDraftingAiMessage] = useState(false)
  const [undoQuery, setUndoQuery] = useState('')

  const stagedCount = status?.files.filter((f) => f.staged).length ?? 0
  const shouldGenerateAiDraft =
    aiAutoSaveEnabled &&
    aiConnectionReady &&
    stagedCount > 0 &&
    message.trim().length === 0 &&
    Boolean(onGenerateAutoMessage)

  const canCommit =
    stagedCount > 0 &&
    !loading &&
    !aiLoading &&
    !draftingAiMessage &&
    (message.trim().length > 0 || shouldGenerateAiDraft)
  const canSuggest = stagedCount > 0 && !loading && !aiLoading && !draftingAiMessage

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
  const showCancelUndo =
    naturalUndoEnabled &&
    Boolean(onCancelNaturalUndo) &&
    (undoQuery.trim().length > 0 ||
      naturalUndoLoading ||
      Boolean(naturalUndoError) ||
      Boolean(naturalUndoSuggestion))

  const handleCommit = async (): Promise<void> => {
    if (!canCommit) return

    if (shouldGenerateAiDraft && onGenerateAutoMessage) {
      setDraftingAiMessage(true)

      try {
        const suggestion = await onGenerateAutoMessage()

        if (suggestion) {
          onMessageChange(suggestion)
          setHelperText(t.aiDraftReady)
          return
        }

        setHelperText(t.aiDraftFailed)
        return
      } finally {
        setDraftingAiMessage(false)
      }
    }

    setHelperText(null)
    onCommit()
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

  const handleCancelUndo = (): void => {
    setUndoQuery('')
    onCancelNaturalUndo?.()
  }

  return (
    <div className={styles.panel}>
      {error && (
        <div className={styles.errorBanner}>
          <span>{error.message}</span>
          {error.code === 'AUTH_FAILED' ? (
            <button className={styles.connectCta} onClick={onOpenGitHubConnect}>
              {t.authFailedConnectLabel}
            </button>
          ) : (
            <button className={styles.dismissBtn} onClick={onClearError} aria-label={t.dismissErrorLabel}>
              ×
            </button>
          )}
        </div>
      )}

      <div className={styles.messageRow}>
        <textarea
          className={styles.messageInput}
          value={message}
          onChange={(e) => {
            onMessageChange(e.target.value)
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
        <button
          className={styles.suggestBtn}
          onClick={onSuggestMessage}
          disabled={!canSuggest}
          title={t.aiSuggestTitle}
        >
          {aiLoading ? <Spinner size={14} /> : t.aiSuggestBtn}
        </button>
      </div>

      {helperText && <div className={styles.helperText}>{helperText}</div>}

      {uploadHandoff?.prUrl && (
        <div className={styles.uploadHandoff}>
          <span>{t.uploadedBranch(uploadHandoff.branchName)}</span>
          <a
            className={styles.uploadHandoffLink}
            href={uploadHandoff.prUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t.openPullRequest}
          </a>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleCommit} disabled={!canCommit}>
          {loading || aiLoading || draftingAiMessage ? <Spinner size={14} /> : null}
          {loading
            ? t.committingBtn
            : draftingAiMessage
              ? t.draftingBtn
              : aiLoading
                ? t.thinkingBtn
                : t.commitBtn(stagedCount)}
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
          <span className={styles.undoTitle}>{t.naturalUndoTitle}</span>
          <div className={styles.undoHeaderActions}>
            {!naturalUndoEnabled && <span className={styles.undoHint}>{t.aiConnectionRequired}</span>}
            {showCancelUndo && (
              <button
                type="button"
                className={styles.undoCancelBtn}
                onClick={handleCancelUndo}
                disabled={naturalUndoApplying}
                aria-label={t.cancelNaturalUndoLabel}
                title={t.cancelNaturalUndoLabel}
              >
                ×
              </button>
            )}
          </div>
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
            placeholder={t.naturalUndoPlaceholder}
            disabled={!naturalUndoEnabled || naturalUndoApplying}
          />
          <button
            className={styles.undoSuggestBtn}
            onClick={() => {
              void handleSuggestUndo()
            }}
            disabled={!canSuggestUndo}
          >
            {naturalUndoLoading ? t.naturalUndoAnalyzingBtn : t.naturalUndoFindBtn}
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
              <span>{t.confidenceLabel((naturalUndoSuggestion.confidence * 100).toFixed(0))}</span>
            </div>
            <div className={styles.undoReason}>{naturalUndoSuggestion.reason}</div>

            <div className={styles.undoPreview}>
              <span>{t.restoreFiles(naturalUndoSuggestion.total_restore_files)}</span>
              <span>{t.removeFiles(naturalUndoSuggestion.total_remove_files)}</span>
            </div>

            {naturalUndoSuggestion.restore_files_preview.length > 0 && (
              <div className={styles.undoFileList}>
                {naturalUndoSuggestion.restore_files_preview.map((filePath) => (
                  <div key={`restore:${filePath}`}>{t.restoreFilePrefix}: {filePath}</div>
                ))}
              </div>
            )}

            {naturalUndoSuggestion.remove_files_preview.length > 0 && (
              <div className={styles.undoFileList}>
                {naturalUndoSuggestion.remove_files_preview.map((filePath) => (
                  <div key={`remove:${filePath}`}>{t.removeFilePrefix}: {filePath}</div>
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
              {naturalUndoApplying ? t.restoringBtn : t.restorePointBtn}
            </button>

            {naturalUndoSuggestion.alternatives.length > 0 && (
              <div className={styles.undoAlternatives}>
                <div className={styles.undoAlternativesLabel}>
                  {t.alternativeMatchesLabel}
                </div>
                {naturalUndoSuggestion.alternatives.map((alt, index) => (
                  <button
                    key={alt.commit_hash}
                    type="button"
                    className={styles.undoAlternativeItem}
                    onClick={() => onSelectNaturalUndoAlternative?.(index)}
                    disabled={naturalUndoApplying || !onSelectNaturalUndoAlternative}
                  >
                    <div className={styles.undoAlternativeHeader}>
                      <strong>{alt.short_hash}</strong>
                      <span className={styles.undoAlternativeMeta}>
                        {new Date(alt.commit_date).toLocaleString()} · {(alt.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className={styles.undoAlternativeReason}>{alt.reason}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
