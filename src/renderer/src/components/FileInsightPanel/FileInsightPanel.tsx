import { FileInsight } from '../../types'
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
  if (!enabled) {
    return (
      <aside className={styles.panel}>
        <div className={styles.title}>File Insight</div>
        <p className={styles.placeholder}>Set an OpenAI key in Settings to use AI file explanations.</p>
      </aside>
    )
  }

  if (!selectedPath) {
    return (
      <aside className={styles.panel}>
        <div className={styles.title}>File Insight</div>
        <p className={styles.placeholder}>Click a file to view what it does and related files.</p>
      </aside>
    )
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>File Insight</div>
        <button className={styles.retryBtn} onClick={onRetry} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      <div className={styles.path} title={selectedPath}>{selectedPath}</div>

      {error && <div className={styles.error}>{error}</div>}

      {!error && loading && (
        <div className={styles.placeholder}>Analyzing file role and related files...</div>
      )}

      {!error && !loading && insight && (
        <div className={styles.body}>
          <section className={styles.section}>
            <h4>Summary</h4>
            <p>{insight.summary}</p>
          </section>

          <section className={styles.section}>
            <h4>What This File Does</h4>
            <p>{insight.functionality}</p>
          </section>

          <section className={styles.section}>
            <h4>Related Files</h4>
            {insight.related_files.length === 0 ? (
              <p>No related files found.</p>
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
