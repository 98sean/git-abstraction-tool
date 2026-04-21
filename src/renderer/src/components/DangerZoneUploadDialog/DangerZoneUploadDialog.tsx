import styles from './DangerZoneUploadDialog.module.css'

interface Props {
  branchName: string
  onCancel: () => void
  onConfirm: () => void
}

export function DangerZoneUploadDialog({
  branchName,
  onCancel,
  onConfirm
}: Props): JSX.Element {
  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="danger-upload-title">
        <p className={styles.eyebrow}>Risky Upload</p>
        <h2 id="danger-upload-title" className={styles.title}>
          Upload directly to {branchName}
        </h2>
        <p className={styles.copy}>
          This can update the team&apos;s default branch without review. Continue only if you are sure.
        </p>

        <div className={styles.buttonRow}>
          <button className={styles.secondaryButton} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.dangerButton} onClick={onConfirm}>
            Confirm risky upload
          </button>
        </div>
      </div>
    </div>
  )
}
