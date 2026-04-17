import { useState } from 'react'
import { ApiKeys } from '../../hooks/useApiKeys'
import styles from './ApiKeySettings.module.css'

interface Props {
  keys: ApiKeys
  onSaveOpenAI: (key: string) => void
  onSaveAnthropic: (key: string) => void
  onClearOpenAI: () => void
  onClearAnthropic: () => void
  onClose: () => void
}

function maskKey(key: string): string {
  if (key.length <= 8) return '•'.repeat(key.length)
  return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
}

interface KeyRowProps {
  label: string
  provider: string
  placeholder: string
  currentKey: string | null
  onSave: (key: string) => void
  onClear: () => void
}

function KeyRow({ label, provider, placeholder, currentKey, onSave, onClear }: KeyRowProps): JSX.Element {
  const [draft, setDraft] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = (): void => {
    if (!draft.trim()) return
    onSave(draft.trim())
    setDraft('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = (): void => {
    onClear()
    setDraft('')
  }

  return (
    <div className={styles.keyRow}>
      <div className={styles.keyRowHeader}>
        <span className={styles.providerLabel}>{label}</span>
        <span className={`${styles.statusBadge} ${currentKey ? styles.set : styles.notSet}`}>
          {currentKey ? 'Key saved' : 'Not set'}
        </span>
      </div>

      {currentKey && (
        <div className={styles.existingKey}>
          <span className={styles.maskedKey}>
            {showKey ? currentKey : maskKey(currentKey)}
          </span>
          <button
            className={styles.visibilityBtn}
            onClick={() => setShowKey((v) => !v)}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? '🙈' : '👁'}
          </button>
          <button className={styles.clearBtn} onClick={handleClear}>
            Remove
          </button>
        </div>
      )}

      <div className={styles.inputRow}>
        <input
          type="password"
          className={styles.keyInput}
          placeholder={currentKey ? `Replace ${provider} key…` : placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!draft.trim()}
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export function ApiKeySettings({
  keys,
  onSaveOpenAI,
  onSaveAnthropic,
  onClearOpenAI,
  onClearAnthropic,
  onClose
}: Props): JSX.Element {
  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="API Key Settings">
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.title}>API Key Settings</h2>
            <p className={styles.description}>
              Enter your own API key to use AI features. Your key is stored locally in your
              browser only.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <KeyRow
            label="OpenAI (ChatGPT)"
            provider="OpenAI"
            placeholder="sk-…"
            currentKey={keys.openai}
            onSave={onSaveOpenAI}
            onClear={onClearOpenAI}
          />

          <div className={styles.divider} />

          <KeyRow
            label="Anthropic (Claude)"
            provider="Anthropic"
            placeholder="sk-ant-…"
            currentKey={keys.anthropic}
            onSave={onSaveAnthropic}
            onClear={onClearAnthropic}
          />
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            🔒 Keys are never sent to our servers. They are only used directly from your device.
          </p>
        </div>
      </div>
    </div>
  )
}
