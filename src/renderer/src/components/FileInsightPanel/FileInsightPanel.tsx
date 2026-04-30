import { FileInsight } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './FileInsightPanel.module.css'

interface Props {
  selectedPath: string | null
  insight: FileInsight | null
  loading: boolean
  error: string | null
  enabled: boolean
  onRetry: () => void
  onSelectRelated: (path: string) => void
}

export function FileInsightPanel({
  selectedPath,
  insight,
  loading,
  error,
  enabled,
  onRetry,
  onSelectRelated
}: Props): JSX.Element {
  const t = useTerms()

  if (!enabled) {
    return (
      <aside className={styles.panel}>
        <div className={styles.title}>{t.fileInsightTitle}</div>
        <p className={styles.placeholder}>{t.fileInsightConnectAiHint}</p>
      </aside>
    )
  }

  if (!selectedPath) {
    return (
      <aside className={styles.panel}>
        <div className={styles.title}>{t.fileInsightTitle}</div>
        <p className={styles.placeholder}>{t.fileInsightSelectFileHint}</p>
      </aside>
    )
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>{t.fileInsightTitle}</div>
        <button className={styles.retryBtn} onClick={onRetry} disabled={loading}>
          {loading ? t.fileInsightAnalyzingBtn : t.fileInsightRefreshBtn}
        </button>
      </div>

      <div className={styles.path} title={selectedPath}>{selectedPath}</div>

      {error && <div className={styles.error}>{error}</div>}

      {!error && loading && (
        <div className={styles.placeholder}>{t.fileInsightAnalyzingText}</div>
      )}

      {!error && !loading && insight && (
        <div className={styles.body}>
          <section className={styles.section}>
            <h4>{t.fileInsightSummaryTitle}</h4>
            <p>{insight.summary}</p>
          </section>

          <section className={styles.section}>
            <h4>{t.fileInsightFunctionalityTitle}</h4>
            <p>{insight.functionality}</p>
          </section>

          <section className={styles.section}>
            <h4>{t.fileInsightRelatedFilesTitle}</h4>
            {insight.related_files.length === 0 ? (
              <p>{t.fileInsightNoRelatedFiles}</p>
            ) : (
              <div className={styles.relatedList}>
                {insight.related_files.map((item) => (
                  <button
                    key={item.path}
                    className={styles.relatedItem}
                    onClick={() => onSelectRelated(item.path)}
                  >
                    <span className={styles.relatedPath}>{item.path}</span>
                    <span className={styles.relatedReason}>{item.reason}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </aside>
  )
}
