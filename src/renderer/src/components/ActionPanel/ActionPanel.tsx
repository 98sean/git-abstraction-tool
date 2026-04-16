import { useState } from 'react'
import { GitError, GitStatus, PushToCloudOptions } from '../../types'
import { DeviceFlowState } from '../../hooks/useAuth'
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
  onCommit: (message: string) => void
  onPush: (options?: PushToCloudOptions) => void
  onPull: () => void
  onOpenCloudSetup: () => void
  onClearError: () => void
  onConnectGitHub: (token: string) => Promise<void>
  onOpenGitHubDocs: () => void
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
  onGenerateAutoMessage?: () => Promise<string | null>
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
  onCommit,
  onPush,
  onPull,
  onOpenCloudSetup,
  onClearError,
  onConnectGitHub,
  onOpenGitHubDocs,
  onStartDeviceFlow,
  onCancelDeviceFlow,
  onGenerateAutoMessage
}: Props): JSX.Element {
  const [message, setMessage] = useState(messageTemplate)
  const [helperText, setHelperText] = useState<string | null>(null)
  const [draftingAiMessage, setDraftingAiMessage] = useState(false)

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
    !draftingAiMessage &&
    (message.trim().length > 0 || shouldGenerateAiDraft)

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
          onChange={(e) => {
            setMessage(e.target.value)
            setHelperText(null)
          }}
          placeholder={stagedCount > 0 ? 'Describe what you saved…' : 'Select changes above to save'}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              void handleCommit()
            }
          }}
        />
      </div>

      {helperText && <div className={styles.helperText}>{helperText}</div>}

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={() => { void handleCommit() }} disabled={!canCommit}>
          {loading || draftingAiMessage ? <Spinner size={14} /> : null}
          {draftingAiMessage
            ? 'Drafting…'
            : loading
              ? 'Saving…'
              : `Save Progress${stagedCount > 0 ? ` (${stagedCount})` : ''}`}
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
          onClick={handlePush}
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
          {cloudStatusLabel && (
            <span className={`${styles.cloudHint} ${!cloudUploadReady ? styles.pendingCloud : ''}`}>
              {cloudStatusLabel}
            </span>
          )}
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
