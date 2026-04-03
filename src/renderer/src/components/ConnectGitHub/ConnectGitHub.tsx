import { useState } from 'react'
import styles from './ConnectGitHub.module.css'

interface Props {
  onConnect: (token: string) => Promise<void>
  onOpenGitHub: () => void
}

/** Inline panel shown inside ActionPanel when auth fails or no token is set. */
export function ConnectGitHub({ onConnect, onOpenGitHub }: Props): JSX.Element {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConnect = async (): Promise<void> => {
    if (!token.trim()) return
    setSaving(true)
    await onConnect(token.trim())
    setToken('')
    setSaving(false)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Connect to GitHub to upload your work</div>
      <div className={styles.description}>
        Enter a Personal Access Token with <strong>repo</strong> permission to enable cloud sync.
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
        <button className={styles.connectBtn} onClick={handleConnect} disabled={!token.trim() || saving}>
          {saving ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      <button className={styles.helpLink} onClick={onOpenGitHub}>
        How do I get a Personal Access Token? →
      </button>
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
