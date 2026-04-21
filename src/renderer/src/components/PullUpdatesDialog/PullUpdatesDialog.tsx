import { PullUpdatesPreview } from '../../types'
import styles from './PullUpdatesDialog.module.css'

interface Props {
  preview: PullUpdatesPreview | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onClose: () => void
  onConfirmPull: () => void
}

export function PullUpdatesDialog({
  preview,
  loading,
  error,
  onRefresh,
  onClose,
  onConfirmPull
}: Props): JSX.Element {
  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="pull-preview-title">
        <div className={styles.header}>
          <p className={styles.eyebrow}>Incoming updates</p>
          <button className={styles.refreshBtn} onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <h2 id="pull-preview-title" className={styles.title}>
          Review updates before pulling
        </h2>

        {preview && (
          <p className={styles.copy}>
            {preview.behind_count} incoming commit{preview.behind_count !== 1 ? 's' : ''} from{' '}
            {preview.remote_name}/{preview.branch_name}
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {preview && preview.commits.length > 0 && (
          <div className={styles.list} role="list" aria-label="Incoming commits">
            {preview.commits.map((commit) => (
              <div className={styles.item} key={commit.hash} role="listitem">
                <div className={styles.itemTop}>
                  <strong>{commit.short_hash}</strong>
                  <span>{new Date(commit.date).toLocaleString()}</span>
                </div>
                <div className={styles.itemMessage}>{commit.message}</div>
                <div className={styles.itemAuthor}>{commit.author_name}</div>
              </div>
            ))}
          </div>
        )}

        {preview && preview.behind_count > preview.commits.length && (
          <p className={styles.moreHint}>
            + {preview.behind_count - preview.commits.length} more commit
            {preview.behind_count - preview.commits.length !== 1 ? 's' : ''}
          </p>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Later
          </button>
          <button
            className={styles.primaryButton}
            onClick={onConfirmPull}
            disabled={loading || !preview || preview.behind_count <= 0}
          >
            Get updates now
          </button>
        </div>
      </div>
    </div>
  )
}
