import { useState } from 'react'
import { DeviceFlowState } from '../../hooks/useAuth'
import { useTerms } from '../../hooks/useTerms'
import styles from './ConnectGitHub.module.css'

interface Props {
  isConnected?: boolean
  onConnect: (token: string) => Promise<void>
  onDisconnect?: () => void
  onClose?: () => void
  onOpenGitHubDocs: () => void
  onOpenDevicePage: () => void
  deviceFlow: DeviceFlowState | null
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
}

/** Inline panel shown inside ActionPanel when auth fails or no token is set. */
export function ConnectGitHub({
  isConnected,
  onConnect,
  onDisconnect,
  onClose,
  onOpenGitHubDocs,
  onOpenDevicePage,
  deviceFlow,
  onStartDeviceFlow,
  onCancelDeviceFlow
}: Props): JSX.Element {
  const t = useTerms()
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPat, setShowPat] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleConnect = async (): Promise<void> => {
    if (!token.trim()) return
    setSaving(true)
    await onConnect(token.trim())
    setToken('')
    setSaving(false)
  }

  const handleCopyCode = (): void => {
    if (!deviceFlow) return
    navigator.clipboard.writeText(deviceFlow.user_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (isConnected) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{t.gitHubConnectedLabel}</div>
            <div className={styles.description}>{t.gitHubConnectedDescription}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t.closeGitHubPanelLabel}>×</button>
        </div>
        <button className={styles.disconnectBtn} onClick={onDisconnect}>
          {t.disconnectGitHubBtn}
        </button>
      </div>
    )
  }

  if (deviceFlow) {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>Waiting for GitHub authorization</div>
        <div className={styles.description}>
          Your browser has opened. Sign in to GitHub and enter this code:
        </div>
        <div className={styles.codeRow}>
          <div className={styles.userCode}>{deviceFlow.user_code}</div>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopyCode}
            title="Copy code to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div className={styles.waitingRow}>
          <span className={styles.waitingText}>Waiting for approval…</span>
          <button className={styles.cancelBtn} onClick={onCancelDeviceFlow}>
            Cancel
          </button>
        </div>
        <button className={styles.helpLink} onClick={onOpenDevicePage}>
          Can&apos;t see the page? Open github.com/login/device →
        </button>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Connect to GitHub to upload your work</div>

      <button className={styles.oauthBtn} onClick={onStartDeviceFlow}>
        Login with GitHub
      </button>

      {!showPat ? (
        <button className={styles.helpLink} onClick={() => setShowPat(true)}>
          Use a Personal Access Token instead →
        </button>
      ) : (
        <>
          <div className={styles.divider}>or use a Personal Access Token</div>
          <div className={styles.description}>
            Supports classic <strong>ghp_</strong> and fine-grained <strong>github_pat_</strong> tokens.
          </div>
          <div className={styles.inputRow}>
            <input
              type="password"
              className={styles.tokenInput}
              placeholder="ghp_... or github_pat_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              autoFocus
            />
            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={!token.trim() || saving}
            >
              {saving ? 'Connecting…' : 'Connect'}
            </button>
          </div>
          <button className={styles.helpLink} onClick={onOpenGitHubDocs}>
            How do I get a Personal Access Token? →
          </button>
        </>
      )}
    </div>
  )
}

interface SidebarStatusProps {
  connected: boolean
  onClick: () => void
}

/** Compact status button for the Sidebar footer. */
export function GitHubStatus({ connected, onClick }: SidebarStatusProps): JSX.Element {
  return (
    <button
      className={`${styles.sidebarStatus} ${styles.sidebarStatusCentered} ${connected ? styles.connectedStatus : ''}`}
      onClick={onClick}
      title={connected ? 'Manage GitHub connection' : 'Connect GitHub'}
    >
      <span className={`${styles.dot} ${connected ? styles.connected : ''}`} />
      {connected ? 'GitHub connected' : 'Connect GitHub'}
    </button>
  )
}
