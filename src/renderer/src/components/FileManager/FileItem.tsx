import { FileStatus, FileStatusCode } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './FileManager.module.css'

interface Props {
  file: FileStatus
  onToggleStage: (path: string, staged: boolean) => void
  onRevert: (path: string) => void
}

const STATUS_LABELS: Record<FileStatusCode, string> = {
  new: 'New file',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflicted: 'Conflict ⚠',
  untracked: 'Untracked'
}

export function FileItem({ file, onToggleStage, onRevert }: Props): JSX.Element {
  const t = useTerms()
  return (
    <div
      className={`${styles.fileRow} ${file.staged ? styles.staged : ''}`}
      onClick={() => onToggleStage(file.path, file.staged)}
    >
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={file.staged}
        onChange={() => onToggleStage(file.path, file.staged)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`${file.staged ? 'Unstage' : 'Stage'} ${file.path}`}
      />
      <span className={`${styles.statusDot} ${styles[`dot_${file.status}`]}`} />
      <span className={styles.filePath} title={file.path}>
        {file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}
      </span>
      <span className={styles.statusLabel}>{STATUS_LABELS[file.status]}</span>
      {file.status !== 'deleted' && file.status !== 'new' && (
        <button
          className={styles.revertBtn}
          onClick={(e) => { e.stopPropagation(); onRevert(file.path) }}
          title={t.revertTitle}
        >
          {t.revertBtn}
        </button>
      )}
    </div>
  )
}
