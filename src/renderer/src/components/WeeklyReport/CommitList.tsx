import React, { useState } from 'react'
import { WeeklyCommit, WeeklyCommitFile } from '../../types'
import { useTerms } from '../../hooks/useTerms'

interface Props {
  commits: WeeklyCommit[]
}

const STATUS_LABELS: Record<WeeklyCommitFile['status'], string> = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed'
}

const STATUS_DOT_CLASS: Record<WeeklyCommitFile['status'], string> = {
  added: 'wr-dot--added',
  modified: 'wr-dot--modified',
  deleted: 'wr-dot--deleted',
  renamed: 'wr-dot--renamed'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hours}:${minutes}`
}

function CommitItem({ commit }: { commit: WeeklyCommit }): React.JSX.Element {
  const t = useTerms()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="wr-commit">
      <button
        className="wr-commit-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={commit.message || '(no message)'}
      >
        <span className="wr-commit-toggle">{expanded ? '▾' : '▸'}</span>
        <span className="wr-commit-message">
          {commit.message || '(no message)'}
          {commit.is_initial_import && (
            <span
              className="wr-commit-badge"
              title={t.weeklyInitialImportTitle}
            >
              {t.weeklyInitialImportLabel}
            </span>
          )}
        </span>
        <span className="wr-commit-meta">
          {formatDate(commit.date)} · {t.weeklyCommitFileCount(commit.files.length)}
        </span>
      </button>

      {expanded && (
        <ul className="wr-commit-files">
          {commit.files.map((file, idx) => (
            <li key={`${file.path}-${idx}`} className="wr-commit-file">
              <span className={`wr-dot ${STATUS_DOT_CLASS[file.status]}`} />
              <span className="wr-file-path" title={file.path}>{file.path}</span>
              <span className="wr-file-status">{t.weeklyFileStatusLabel(STATUS_LABELS[file.status])}</span>
              {(file.insertions > 0 || file.deletions > 0) && (
                <span className="wr-file-lines">
                  {file.insertions > 0 && <span className="wr-ins">+{file.insertions}</span>}
                  {file.deletions > 0 && <span className="wr-del">-{file.deletions}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CommitList({ commits }: Props): React.JSX.Element {
  const t = useTerms()

  if (commits.length === 0) {
    return (
      <div className="wr-empty">
        <span className="wr-empty-icon">📭</span>
        <p>{t.weeklyNoCommitsThisWeek}</p>
      </div>
    )
  }

  return (
    <div className="wr-commit-list">
      <h3 id="weekly-commit-history-title" className="wr-section-title">
        {t.weeklyCommitHistoryTitle}
      </h3>
      <div
        className="wr-commit-scroll-region"
        role="list"
        aria-labelledby="weekly-commit-history-title"
      >
        {commits.map((commit) => (
          <CommitItem key={commit.hash} commit={commit} />
        ))}
      </div>
    </div>
  )
}
