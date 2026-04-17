import { GitError, GitStatus } from '../../types'
import { useTerms } from '../../hooks/useTerms'
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
  const t = useTerms()

  if (loading && !status) {
    return (
      <div className={styles.loadingState}>
        <Spinner />
        <span>{t.loadingStatus}</span>
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
        <div className={styles.emptyText}>{t.cleanTitle}</div>
        <div className={styles.emptySubtext}>{t.cleanSubtext}</div>
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
          {t.stageAll}
        </button>
        <button
          className={styles.toolbarBtn}
          onClick={onUnstageAll}
          disabled={stagedCount === 0}
        >
          {t.unstageAll}
        </button>
        <span className={styles.fileCount}>
          {t.stagedOf(stagedCount, totalCount)}
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
