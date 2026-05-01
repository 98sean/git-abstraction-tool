import { useState } from 'react'
import { FileStatus } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './ConflictResolver.module.css'

interface ConflictHint {
  hint: string
  recommendation: 'ours' | 'theirs' | 'either'
}

interface Props {
  conflictedFiles: FileStatus[]
  aiEnabled?: boolean
  onResolve: (filePath: string, strategy: 'ours' | 'theirs') => Promise<void>
  onAbort: () => Promise<void>
  onComplete: (message: string) => Promise<void>
  onClose: () => void
  onSuggestMessage?: () => Promise<{ message: string }>
  onAnalyzeFile?: (filePath: string) => Promise<ConflictHint>
}

export function ConflictResolver({
  conflictedFiles,
  aiEnabled,
  onResolve,
  onAbort,
  onComplete,
  onClose,
  onSuggestMessage,
  onAnalyzeFile
}: Props): JSX.Element {
  const t = useTerms()
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [aborting, setAborting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [hints, setHints] = useState<Record<string, ConflictHint>>({})
  const [commitMessage, setCommitMessage] = useState(t.conflictMergeCommitMessage)

  const allResolved = conflictedFiles.length > 0 && resolved.size === conflictedFiles.length
  const showAi = aiEnabled && Boolean(onSuggestMessage || onAnalyzeFile)

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

  const handleSuggest = async (): Promise<void> => {
    if (!onSuggestMessage) return
    setSuggesting(true)
    try {
      const result = await onSuggestMessage()
      setCommitMessage(result.message)
    } finally {
      setSuggesting(false)
    }
  }

  const handleAnalyze = async (filePath: string): Promise<void> => {
    if (!onAnalyzeFile) return
    setAnalyzing(filePath)
    try {
      const hint = await onAnalyzeFile(filePath)
      setHints((prev) => ({ ...prev, [filePath]: hint }))
    } finally {
      setAnalyzing(null)
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
            const isAnalyzing = analyzing === file.path
            const hint = hints[file.path]
            return (
              <div key={file.path} className={`${styles.fileRow} ${isResolved ? styles.fileRowResolved : ''}`}>
                <div className={styles.fileRowMain}>
                  <span className={styles.filePath}>{file.path}</span>
                  {isResolved ? (
                    <span className={styles.resolvedBadge}>{t.resolvedLabel}</span>
                  ) : (
                    <div className={styles.fileActions}>
                      {showAi && onAnalyzeFile && (
                        <button
                          className={styles.hintBtn}
                          onClick={() => void handleAnalyze(file.path)}
                          disabled={isBusy || isAnalyzing !== false}
                        >
                          {isAnalyzing ? t.conflictAiHinting : t.conflictAiHintBtn}
                        </button>
                      )}
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
                {hint && !isResolved && (
                  <div className={`${styles.hintRow} ${hint.recommendation !== 'either' ? styles.hintRowColored : ''}`}>
                    <span className={styles.hintText}>{hint.hint}</span>
                    {hint.recommendation === 'ours' && (
                      <span className={styles.hintRec}>{t.conflictAiRecommendOurs}</span>
                    )}
                    {hint.recommendation === 'theirs' && (
                      <span className={styles.hintRec}>{t.conflictAiRecommendTheirs}</span>
                    )}
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
            {showAi && onSuggestMessage && (
              <button
                className={styles.suggestBtn}
                onClick={() => void handleSuggest()}
                disabled={suggesting || completing}
              >
                {suggesting ? t.conflictAiSuggesting : t.conflictAiSuggestBtn}
              </button>
            )}
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
