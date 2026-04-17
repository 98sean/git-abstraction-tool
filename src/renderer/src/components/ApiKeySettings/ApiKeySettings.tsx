import { useState } from 'react'
import { ApiKeys } from '../../hooks/useApiKeys'
import styles from './ApiKeySettings.module.css'

interface Props {
  keys: ApiKeys
  loading: boolean
  onSaveOpenAI: (key: string) => Promise<void>
  onSaveAnthropic: (key: string) => Promise<void>
  onClearOpenAI: () => Promise<void>
  onClearAnthropic: () => Promise<void>
  onClose: () => void
}

interface KeyRowProps {
  label: string
  provider: string
  placeholder: string
  isSet: boolean
  onSave: (key: string) => Promise<void>
  onClear: () => Promise<void>
}

function KeyRow({ label, provider, placeholder, isSet, onSave, onClear }: KeyRowProps): JSX.Element {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (): Promise<void> => {
    if (!draft.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(draft.trim())
      setDraft('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not save this key.')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      await onClear()
      setDraft('')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not remove this key.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.keyRow}>
      <div className={styles.keyRowHeader}>
        <span className={styles.providerLabel}>{label}</span>
        <span className={`${styles.statusBadge} ${isSet ? styles.set : styles.notSet}`}>
          {isSet ? 'Key saved' : 'Not set'}
        </span>
      </div>

      <div className={styles.inputRow}>
        <input
          type="password"
          className={styles.keyInput}
          placeholder={isSet ? `Replace ${provider} key...` : placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
          autoComplete="off"
          spellCheck={false}
          disabled={saving}
        />
        <button className={styles.saveBtn} onClick={() => void handleSave()} disabled={!draft.trim() || saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
        {isSet && (
          <button className={styles.clearBtn} onClick={() => void handleClear()} disabled={saving}>
            Remove
          </button>
        )}
      </div>

      {error && <p className={styles.rowError}>{error}</p>}
    </div>
  )
}

export function ApiKeySettings({
  keys,
  loading,
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
              Enter your own API key to use AI features. Keys are encrypted and saved locally on your device.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && <p className={styles.description}>Loading key status...</p>}

          <KeyRow
            label="OpenAI (ChatGPT)"
            provider="OpenAI"
            placeholder="sk-..."
            isSet={keys.openai}
            onSave={onSaveOpenAI}
            onClear={onClearOpenAI}
          />

          <div className={styles.divider} />

          <KeyRow
            label="Anthropic (Claude)"
            provider="Anthropic"
            placeholder="sk-ant-..."
            isSet={keys.anthropic}
            onSave={onSaveAnthropic}
            onClear={onClearAnthropic}
          />
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            Keys are only used on your device for direct provider API calls.
          </p>
        </div>
      </div>
    </div>
  )
}
