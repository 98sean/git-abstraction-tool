import { GitError, GitStatus } from '../../types'
import { Spinner } from '../shared/Spinner'
import { FileItem } from './FileItem'
import styles from './FileManager.module.css'

interface Props {
  status: GitStatus | null
  loading: boolean
  error: GitError | null
  onStage: (paths: string[]) => void
  onUnstage: (paths: string[]) => void
  onStageAll: () => void
  onUnstageAll: () => void
  onRevert: (path: string) => void
}

export function FileManager({
  status,
  loading,
  error,
  onStage,
  onUnstage,
  onStageAll,
  onUnstageAll,
  onRevert
}: Props): JSX.Element {
  if (loading && !status) {
    return (
      <div className={styles.loadingState}>
        <Spinner />
        <span>Checking for changes…</span>
      </div>
    )
  }

  if (error) {
    return <div className={styles.errorState}>{error.message}</div>
  }

  if (!status) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📂</div>
        <div className={styles.emptyText}>Select a project to see changes</div>
      </div>
    )
  }

  if (status.is_clean) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✅</div>
        <div className={styles.emptyText}>Everything is saved</div>
        <div className={styles.emptySubtext}>No unsaved changes</div>
      </div>
    )
  }

  const stagedCount = status.files.filter((f) => f.staged).length
  const totalCount = status.files.length

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          className={styles.toolbarBtn}
          onClick={onStageAll}
          disabled={stagedCount === totalCount}
        >
          Select all
        </button>
        <button
          className={styles.toolbarBtn}
          onClick={onUnstageAll}
          disabled={stagedCount === 0}
        >
          Deselect all
        </button>
        <span className={styles.fileCount}>
          {stagedCount} / {totalCount} selected
        </span>
      </div>

      {status.files.map((file) => (
        <FileItem
          key={file.path}
          file={file}
          onToggleStage={(path, staged) =>
            staged ? onUnstage([path]) : onStage([path])
          }
          onRevert={onRevert}
        />
      ))}
    </div>
  )
}
