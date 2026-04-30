import { useEffect, useState } from 'react'
import { AiConnectionState, AiProvider } from '../../types'
import { useTerms } from '../../hooks/useTerms'
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
  const t = useTerms()
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
          <h2 className={styles.title}>{t.connectAiTitle}</h2>
          <p className={styles.description}>
            {t.connectAiDescription}
          </p>
        </div>
        {isConnected && (
          <button className={styles.disconnectBtn} onClick={() => onDisconnect()}>
            {t.disconnectAiBtn}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className={styles.form}>
          <label className={styles.field}>
            <span>{t.providerLabel}</span>
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
            <span>{t.apiKeyLabel}</span>
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
              {saving ? t.connectingAiBtn : t.connectAiBtn}
            </button>
            <button className={styles.docsBtn} onClick={() => onOpenProviderDocs(provider)}>
              {t.viewProviderDocsBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.connectedPanel}>
          <label className={styles.field}>
            <span>{t.modelLabel}</span>
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
            {t.connectedToProviderLabel(connectionStatus.provider === 'openai' ? 'OpenAI' : 'Anthropic')}
          </div>

          <button className={styles.docsBtn} onClick={() => onOpenProviderDocs(provider)}>
            {t.viewProviderDocsBtn}
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
  const t = useTerms()

  return (
    <button
      className={`${styles.sidebarStatus} ${connected ? styles.connected : ''}`}
      onClick={onClick}
      title={connected ? t.manageAiConnectionTitle : t.connectAiProviderTitle}
    >
      <span className={`${styles.dot} ${connected ? styles.connected : ''}`} />
      {connected ? t.aiConnectedLabel : t.connectAiBtn}
    </button>
  )
}
