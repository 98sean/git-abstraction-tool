import { useState } from 'react'
import { DeviceFlowState } from '../../hooks/useAuth'
import styles from './ConnectGitHub.module.css'

interface Props {
  onConnect: (token: string) => Promise<void>
  onOpenGitHub: () => void
  deviceFlow: DeviceFlowState | null
  onStartDeviceFlow: () => Promise<void>
  onCancelDeviceFlow: () => Promise<void>
}

/** Inline panel shown inside ActionPanel when auth fails or no token is set. */
export function ConnectGitHub({
  onConnect,
  onOpenGitHub,
  deviceFlow,
  onStartDeviceFlow,
  onCancelDeviceFlow
}: Props): JSX.Element {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPat, setShowPat] = useState(false)

  const handleConnect = async (): Promise<void> => {
    if (!token.trim()) return
    setSaving(true)
    await onConnect(token.trim())
    setToken('')
    setSaving(false)
  }

  if (deviceFlow) {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>Waiting for GitHub authorization</div>
        <div className={styles.description}>
          Your browser has opened. Sign in to GitHub and enter this code:
        </div>
        <div className={styles.userCode}>{deviceFlow.user_code}</div>
        <div className={styles.waitingRow}>
          <span className={styles.waitingText}>Waiting for approval…</span>
          <button className={styles.cancelBtn} onClick={onCancelDeviceFlow}>
            Cancel
          </button>
        </div>
        <button className={styles.helpLink} onClick={() => onOpenGitHub()}>
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
            Needs <strong>repo</strong> permission.
          </div>
          <div className={styles.inputRow}>
            <input
              type="password"
              className={styles.tokenInput}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
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
          <button className={styles.helpLink} onClick={onOpenGitHub}>
            How do I get a Personal Access Token? →
          </button>
        </>
      )}
    </div>
  )
}

interface SidebarStatusProps {
  connected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

/** Compact status button for the Sidebar footer. */
export function GitHubStatus({ connected, onConnect, onDisconnect }: SidebarStatusProps): JSX.Element {
  return (
    <button
      className={`${styles.sidebarStatus} ${connected ? styles.connected : ''}`}
      onClick={connected ? onDisconnect : onConnect}
      title={connected ? 'Click to disconnect GitHub' : 'Click to connect GitHub'}
    >
      <span className={`${styles.dot} ${connected ? styles.connected : ''}`} />
      {connected ? 'GitHub connected' : 'Connect GitHub'}
    </button>
  )
}
