// WeeklyReport/renderer/components/CommitList.tsx
// 커밋 상세 목록 (메시지 + 변경 파일 목록, 토글 가능)

import React, { useState } from 'react'
import { WeeklyCommit, WeeklyCommitFile } from '../../types/weekly-report'

interface Props {
  commits: WeeklyCommit[]
}

const STATUS_LABELS: Record<WeeklyCommitFile['status'], string> = {
  added: '추가',
  modified: '수정',
  deleted: '삭제',
  renamed: '이름 변경'
}

const STATUS_DOT_CLASS: Record<WeeklyCommitFile['status'], string> = {
  added: 'wr-dot--added',
  modified: 'wr-dot--modified',
  deleted: 'wr-dot--deleted',
  renamed: 'wr-dot--renamed'
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${month}월 ${day}일 ${hours}:${minutes}`
}

function CommitItem({ commit }: { commit: WeeklyCommit }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="wr-commit">
      <button
        className="wr-commit-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="wr-commit-toggle">{expanded ? '▾' : '▸'}</span>
        <span className="wr-commit-message">{commit.message || '(메시지 없음)'}</span>
        <span className="wr-commit-meta">
          {formatDate(commit.date)} · {commit.files.length}개 파일
        </span>
      </button>

      {expanded && (
        <ul className="wr-commit-files">
          {commit.files.map((file, idx) => (
            <li key={`${file.path}-${idx}`} className="wr-commit-file">
              <span className={`wr-dot ${STATUS_DOT_CLASS[file.status]}`} />
              <span className="wr-file-path" title={file.path}>
                {file.path}
              </span>
              <span className="wr-file-status">{STATUS_LABELS[file.status]}</span>
              {(file.insertions > 0 || file.deletions > 0) && (
                <span className="wr-file-lines">
                  {file.insertions > 0 && (
                    <span className="wr-ins">+{file.insertions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className="wr-del">-{file.deletions}</span>
                  )}
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
  if (commits.length === 0) {
    return (
      <div className="wr-empty">
        <span className="wr-empty-icon">📭</span>
        <p>이번 주에 저장한 내역이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="wr-commit-list">
      <h3 className="wr-section-title">저장 내역</h3>
      {commits.map((commit) => (
        <CommitItem key={commit.hash} commit={commit} />
      ))}
    </div>
  )
}
