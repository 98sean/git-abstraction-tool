import { useState } from 'react'
import { FileStatus } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './ConflictResolver.module.css'

interface Props {
  conflictedFiles: FileStatus[]
  onResolve: (filePath: string, strategy: 'ours' | 'theirs') => Promise<void>
  onAbort: () => Promise<void>
  onComplete: (message: string) => Promise<void>
  onClose: () => void
}

export function ConflictResolver({
  conflictedFiles,
  onResolve,
  onAbort,
  onComplete,
  onClose
}: Props): JSX.Element {
  const t = useTerms()
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [aborting, setAborting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [commitMessage, setCommitMessage] = useState(t.conflictMergeCommitMessage)

  const allResolved = conflictedFiles.length > 0 && resolved.size === conflictedFiles.length

  const handleResolve = async (filePath: string, strategy: 'ours' | 'theirs'): Promise<void> => {
    setBusy(filePath)
    try {
      await onResolve(filePath, strategy)
      setResolved((prev) => new Set(prev).add(filePath))
    } finally {
      setBusy(null)
    }
  }

  const handleAbort = async (): Promise<void> => {
    setAborting(true)
    try {
      await onAbort()
      onClose()
    } finally {
      setAborting(false)
    }
  }

  const handleComplete = async (): Promise<void> => {
    if (!commitMessage.trim()) return
    setCompleting(true)
    try {
      await onComplete(commitMessage.trim())
      onClose()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{t.conflictResolverTitle}</div>
            <div className={styles.desc}>{t.conflictResolverDesc}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.fileList}>
          {conflictedFiles.map((file) => {
            const isResolved = resolved.has(file.path)
            const isBusy = busy === file.path
            return (
              <div key={file.path} className={`${styles.fileRow} ${isResolved ? styles.fileRowResolved : ''}`}>
                <span className={styles.filePath}>{file.path}</span>
                {isResolved ? (
                  <span className={styles.resolvedBadge}>{t.resolvedLabel}</span>
                ) : (
                  <div className={styles.fileActions}>
                    <button
                      className={styles.keepBtn}
                      onClick={() => void handleResolve(file.path, 'ours')}
                      disabled={isBusy}
                    >
                      {t.keepMineBtn}
                    </button>
                    <button
                      className={styles.keepBtn}
                      onClick={() => void handleResolve(file.path, 'theirs')}
                      disabled={isBusy}
                    >
                      {t.keepTheirsBtn}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {allResolved && (
          <div className={styles.completeArea}>
            <input
              className={styles.commitInput}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleComplete() }}
            />
            <button
              className={styles.completeBtn}
              onClick={() => void handleComplete()}
              disabled={completing || !commitMessage.trim()}
            >
              {t.completeMergeBtn}
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <button
            className={styles.abortBtn}
            onClick={() => void handleAbort()}
            disabled={aborting}
          >
            {t.abortMergeBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
