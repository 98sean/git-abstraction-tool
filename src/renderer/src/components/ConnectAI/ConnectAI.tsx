import { useEffect, useState } from 'react'
import { AiConnectionState, AiProvider } from '../../types'
import styles from './ConnectAI.module.css'

interface Props {
  connectionStatus: AiConnectionState
  onConnect: (provider: AiProvider, apiKey: string) => Promise<void>
  onDisconnect: () => Promise<void> | void
  onOpenProviderDocs: (provider: AiProvider) => void
  onSelectModel: (model: string) => Promise<void> | void
}

export function ConnectAI({
  connectionStatus,
  onConnect,
  onDisconnect,
  onOpenProviderDocs,
  onSelectModel
}: Props): JSX.Element {
  const [provider, setProvider] = useState<AiProvider>(connectionStatus.provider ?? 'openai')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (connectionStatus.provider) {
      setProvider(connectionStatus.provider)
    }
  }, [connectionStatus.provider])

  const isConnected = connectionStatus.connection_status === 'connected'

  const handleConnect = async (): Promise<void> => {
    if (!apiKey.trim()) return

    setSaving(true)

    try {
      await onConnect(provider, apiKey.trim())
      setApiKey('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Connect AI save suggestions</h2>
          <p className={styles.description}>
            Use your own OpenAI or Anthropic API key for optional save message drafts.
          </p>
        </div>
        {isConnected && (
          <button className={styles.disconnectBtn} onClick={() => onDisconnect()}>
            Disconnect
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className={styles.form}>
          <label className={styles.field}>
            <span>Provider</span>
            <select
              className={styles.select}
              value={provider}
              onChange={(event) => setProvider(event.target.value as AiProvider)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>API key</span>
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleConnect()
                }
              }}
            />
          </label>

          <div className={styles.actions}>
            <button
              className={styles.connectBtn}
              onClick={() => void handleConnect()}
              disabled={!apiKey.trim() || saving}
            >
              {saving ? 'Connecting…' : 'Connect AI'}
            </button>
            <button className={styles.docsBtn} onClick={() => onOpenProviderDocs(provider)}>
              View provider docs
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.connectedPanel}>
          <label className={styles.field}>
            <span>Model</span>
            <select
              className={styles.select}
              value={connectionStatus.selected_model ?? ''}
              onChange={(event) => void onSelectModel(event.target.value)}
            >
              {connectionStatus.available_models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.summary}>
            Connected to {connectionStatus.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
          </div>

          <button className={styles.docsBtn} onClick={() => onOpenProviderDocs(provider)}>
            View provider docs
          </button>
        </div>
      )}
    </section>
  )
}

interface AIStatusProps {
  connected: boolean
  onClick: () => void
}

export function AIStatus({ connected, onClick }: AIStatusProps): JSX.Element {
  return (
    <button
      className={`${styles.sidebarStatus} ${connected ? styles.connected : ''}`}
      onClick={onClick}
      title={connected ? 'Manage AI connection' : 'Connect an AI provider'}
    >
      <span className={`${styles.dot} ${connected ? styles.connected : ''}`} />
      {connected ? 'AI connected' : 'Connect AI'}
    </button>
  )
}
