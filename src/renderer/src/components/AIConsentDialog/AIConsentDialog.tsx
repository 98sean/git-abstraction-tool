import styles from './AIConsentDialog.module.css'

interface Props {
  onAccept: () => void
  onDecline: () => void
}

export function AIConsentDialog({ onAccept, onDecline }: Props): JSX.Element {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="ai-consent-title">
        <h2 id="ai-consent-title" className={styles.title}>
          Allow AI save messages for this project?
        </h2>
        <p className={styles.body}>
          This sends only the staged diff for this project to your connected AI provider.
        </p>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={onDecline}>
            Not now
          </button>
          <button className={styles.primaryBtn} onClick={onAccept}>
            Allow AI for this project
          </button>
        </div>
      </div>
    </div>
  )
}
