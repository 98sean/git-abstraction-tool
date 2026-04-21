import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FileStatus,
  FileStatusCode,
  GitError,
  GitStatus,
  UntrackedDeleteResult,
  UntrackedReviewResult
} from '../../types'
import { useTerms } from '../../hooks/useTerms'
import { Spinner } from '../shared/Spinner'
import styles from './FileManager.module.css'

// ─── Display types ────────────────────────────────────────────────────────────

type DisplayStatus = FileStatusCode | 'clean'

interface DisplayFile {
  path: string
  status: DisplayStatus
  staged: boolean
  oldPath?: string
}

// ─── Tree types ───────────────────────────────────────────────────────────────

interface DirNode {
  type: 'dir'
  name: string
  fullPath: string
  children: TreeNode[]
  changedCount: number
  stagedCount: number
}

interface FileNode {
  type: 'file'
  name: string
  file: DisplayFile
}

type TreeNode = DirNode | FileNode

// ─── Flat row (for rendering) ─────────────────────────────────────────────────

type FlatRow =
  | { kind: 'dir'; key: string; depth: number; node: DirNode }
  | { kind: 'file'; key: string; depth: number; name: string; file: DisplayFile }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPENDENCY_DIRS = new Set([
  'node_modules', 'vendor', '.venv', 'venv', 'env', '__pycache__',
  'dist', 'build', '.next', '.nuxt', 'target', '.cargo', 'out', '.cache', '.turbo'
])

const STATUS_LABELS: Record<DisplayStatus, string> = {
  clean: 'Synced',
  new: 'New',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflicted: 'Conflict',
  untracked: 'Untracked'
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(files: DisplayFile[]): TreeNode[] {
  const roots: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/')
    let level = roots

    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      const fp = parts.slice(0, i + 1).join('/')
      let dir = level.find((n): n is DirNode => n.type === 'dir' && n.name === seg)
      if (!dir) {
        dir = { type: 'dir', name: seg, fullPath: fp, children: [], changedCount: 0, stagedCount: 0 }
        level.push(dir)
      }
      level = dir.children
    }
    level.push({ type: 'file', name: parts[parts.length - 1], file })
  }

  function annotate(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map((n) => {
        if (n.type === 'dir') {
          n.children = annotate(n.children) as TreeNode[]
          n.changedCount = n.children.reduce(
            (s, c) => s + (c.type === 'file' ? (c.file.status !== 'clean' ? 1 : 0) : c.changedCount), 0
          )
          n.stagedCount = n.children.reduce(
            (s, c) => s + (c.type === 'file' ? (c.file.staged ? 1 : 0) : c.stagedCount), 0
          )
        }
        return n
      })
  }

  return annotate(roots)
}

/** Walk the tree and return the fullPath of every directory node. */
function collectDirPaths(nodes: TreeNode[]): string[] {
  const out: string[] = []
  for (const n of nodes) {
    if (n.type === 'dir') {
      out.push(n.fullPath)
      out.push(...collectDirPaths(n.children))
    }
  }
  return out
}

function flattenTree(nodes: TreeNode[], collapsed: Set<string>, depth = 0): FlatRow[] {
  const rows: FlatRow[] = []
  for (const n of nodes) {
    if (n.type === 'dir') {
      rows.push({ kind: 'dir', key: n.fullPath, depth, node: n })
      if (!collapsed.has(n.fullPath)) {
        rows.push(...flattenTree(n.children, collapsed, depth + 1))
      }
    } else {
      rows.push({ kind: 'file', key: n.file.path, depth, name: n.name, file: n.file })
    }
  }
  return rows
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  status: GitStatus | null
  trackedPaths: string[]
  selectedPath?: string | null
  loading: boolean
  error: GitError | null
  aiReviewEnabled?: boolean
  onStage: (paths: string[]) => void
  onUnstage: (paths: string[]) => void
  onStageAll: () => void
  onUnstageAll: () => void
  onRevert: (path: string) => void
  onSelectFile?: (path: string) => void
  onReviewUntracked?: () => Promise<UntrackedReviewResult>
  onDeleteUntracked?: (paths: string[]) => Promise<UntrackedDeleteResult>
}

export function FileManager({
  status, trackedPaths, selectedPath, loading, error, aiReviewEnabled = false,
  onStage, onUnstage, onStageAll, onUnstageAll, onRevert, onSelectFile, onReviewUntracked, onDeleteUntracked
}: Props): JSX.Element {
  const t = useTerms()
  const [showDeps, setShowDeps] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewApplying, setReviewApplying] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [review, setReview] = useState<UntrackedReviewResult | null>(null)
  const [deleteSelected, setDeleteSelected] = useState<Set<string>>(new Set())

  // ── Merge tracked + changed into DisplayFile list ──────────────────────────
  const allFiles = useMemo<DisplayFile[]>(() => {
    const changedMap = new Map<string, FileStatus>()
    for (const f of status?.files ?? []) changedMap.set(f.path, f)

    const result: DisplayFile[] = []
    const seen = new Set<string>()

    for (const path of trackedPaths) {
      seen.add(path)
      const ch = changedMap.get(path)
      result.push(ch ? { ...ch } : { path, status: 'clean', staged: false })
    }

    // Untracked / new files that git status reports but aren't in ls-files yet
    for (const f of status?.files ?? []) {
      if (!seen.has(f.path)) result.push({ ...f })
    }

    return result
  }, [status, trackedPaths])

  const tree = useMemo(() => buildTree(allFiles), [allFiles])

  // ── Filter dependency dirs ─────────────────────────────────────────────────
  const visibleTree = useMemo(
    () => showDeps ? tree : tree.filter(n => !DEPENDENCY_DIRS.has(n.name)),
    [tree, showDeps]
  )

  const hiddenDepChanges = useMemo(() => {
    if (showDeps) return 0
    return tree
      .filter((n): n is DirNode => n.type === 'dir' && DEPENDENCY_DIRS.has(n.name))
      .reduce((s, n) => s + n.changedCount, 0)
  }, [tree, showDeps])

  // When a folder first appears in the tree (i.e. on the initial load of a
  // project, or when new nested folders show up later), default it to
  // collapsed so users don't face an overwhelming fully-expanded view.
  // Folders they've already seen and interacted with keep whatever state
  // they're in — we only touch *newly-seen* paths.
  const seenDirPathsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const allDirs = collectDirPaths(visibleTree)
    const seen = seenDirPathsRef.current
    const freshlyDiscovered = allDirs.filter((p) => !seen.has(p))
    if (freshlyDiscovered.length === 0) return

    for (const p of allDirs) seen.add(p)
    setCollapsed((prev) => {
      const next = new Set(prev)
      for (const p of freshlyDiscovered) next.add(p)
      return next
    })
  }, [visibleTree])

  const flatRows = useMemo(() => flattenTree(visibleTree, collapsed), [visibleTree, collapsed])

  const changedCount = allFiles.filter(f => f.status !== 'clean').length
  const stagedCount  = allFiles.filter(f => f.staged).length
  const untrackedCount = allFiles.filter((f) => f.status === 'untracked').length

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleDir = (fp: string): void =>
    setCollapsed(prev => { const s = new Set(prev); s.has(fp) ? s.delete(fp) : s.add(fp); return s })

  const handleToggleFile = (file: DisplayFile): void => {
    if (file.status === 'clean') return
    if (file.staged) onUnstage([file.path])
    else onStage([file.path])
  }

  const loadUntrackedReview = async (): Promise<void> => {
    if (!onReviewUntracked) return
    setReviewOpen(true)
    setReviewLoading(true)
    setReviewError(null)
    try {
      const result = await onReviewUntracked()
      setReview(result)
      setDeleteSelected(
        new Set(result.items.filter((i) => i.recommendation === 'delete').map((i) => i.path))
      )
    } catch (err) {
      setReviewError((err as { message?: string })?.message ?? 'Could not review untracked files.')
      setReview(null)
      setDeleteSelected(new Set())
    } finally {
      setReviewLoading(false)
    }
  }

  const toggleDeleteSelection = (filePath: string): void => {
    setDeleteSelected((prev) => {
      const next = new Set(prev)
      if (next.has(filePath)) next.delete(filePath)
      else next.add(filePath)
      return next
    })
  }

  const handleDeleteSelected = async (): Promise<void> => {
    if (!onDeleteUntracked || deleteSelected.size === 0) return
    setReviewApplying(true)
    setReviewError(null)
    try {
      await onDeleteUntracked(Array.from(deleteSelected))
      await loadUntrackedReview()
    } catch (err) {
      setReviewError((err as { message?: string })?.message ?? 'Could not delete selected files.')
    } finally {
      setReviewApplying(false)
    }
  }

  const handleStageRecommended = (): void => {
    if (!review) return
    const commitPaths = review.items
      .filter((i) => i.recommendation === 'commit')
      .map((i) => i.path)
    if (commitPaths.length === 0) return
    onStage(commitPaths)
  }

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (loading && !status) {
    return (
      <div className={styles.loadingState}>
        <Spinner />
        <span>{t.loadingStatus}</span>
      </div>
    )
  }

  if (error) return <div className={styles.errorState}>{error.message}</div>

  if (!status) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📂</div>
        <div className={styles.emptyText}>Select a project to see its files</div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={styles.toolbarBtn}
          onClick={onStageAll}
          disabled={changedCount === 0 || stagedCount === changedCount}
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

        <span className={styles.fileCount}>{t.stagedOf(stagedCount, changedCount)}</span>

        {status.ahead > 0 && (
          <span className={styles.aheadBadge}>↑ {status.ahead} to push</span>
        )}

        {hiddenDepChanges > 0 && (
          <button className={styles.depWarning} onClick={() => setShowDeps(true)}>
            ⚠ {hiddenDepChanges} in deps
          </button>
        )}

        <button
          className={`${styles.depsToggle} ${showDeps ? styles.depsActive : ''}`}
          onClick={() => setShowDeps(v => !v)}
          title={showDeps ? 'Hide dependency folders' : 'Show dependency folders (node_modules etc.)'}
        >
          {showDeps ? 'Hide deps' : 'Show deps'}
        </button>

        {untrackedCount > 0 && aiReviewEnabled && onReviewUntracked && (
          <button
            className={styles.reviewBtn}
            onClick={() => void loadUntrackedReview()}
            disabled={reviewLoading || reviewApplying}
          >
            {reviewLoading ? 'Reviewing...' : `Review untracked (${untrackedCount})`}
          </button>
        )}
      </div>

      {/* Tree */}
      <div className={styles.tree}>
        {flatRows.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            <div className={styles.emptyText}>{t.cleanTitle}</div>
            <div className={styles.emptySubtext}>{t.cleanSubtext}</div>
          </div>
        ) : (
          flatRows.map(row => {
            if (row.kind === 'dir') {
              const { node, depth } = row
              const isCollapsed = collapsed.has(node.fullPath)
              return (
                <div
                  key={row.key}
                  className={styles.dirRow}
                  style={{ paddingLeft: 12 + depth * 16 }}
                  onClick={() => toggleDir(node.fullPath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && toggleDir(node.fullPath)}
                >
                  <span className={styles.dirArrow}>{isCollapsed ? '▶' : '▼'}</span>
                  <span className={styles.dirName}>{node.name}</span>
                  <span className={styles.dirSlash}>/</span>
                  {node.changedCount > 0 && (
                    <span className={styles.dirBadge}>{node.changedCount}</span>
                  )}
                </div>
              )
            }

            const { file, name, depth } = row
            const isClean = file.status === 'clean'

            return (
              <div
                key={row.key}
                className={`${styles.fileRow} ${isClean ? styles.cleanRow : ''} ${file.staged ? styles.staged : ''} ${selectedPath === file.path ? styles.selected : ''}`}
                style={{ paddingLeft: 12 + depth * 16 }}
                onClick={() => onSelectFile?.(file.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelectFile?.(file.path)}
              >
                {isClean ? (
                  <span className={styles.checkPlaceholder} />
                ) : (
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={file.staged}
                    onChange={() => handleToggleFile(file)}
                    onClick={e => e.stopPropagation()}
                    aria-label={`${file.staged ? 'Unstage' : 'Stage'} ${file.path}`}
                  />
                )}
                <span className={`${styles.statusDot} ${styles[`dot_${file.status}`]}`} />
                <span className={styles.fileName} title={file.path}>
                  {file.oldPath
                    ? `${file.oldPath.split('/').pop()} → ${name}`
                    : name}
                </span>
                <span className={`${styles.statusLabel} ${isClean ? styles.cleanLabel : ''}`}>
                  {STATUS_LABELS[file.status]}
                </span>
                {!isClean && file.status !== 'deleted' && file.status !== 'new' && (
                  <button
                    className={styles.revertBtn}
                    onClick={e => { e.stopPropagation(); onRevert(file.path) }}
                    title={t.revertTitle}
                  >
                    {t.revertBtn}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {reviewOpen && (
        <div
          className={styles.reviewBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget && !reviewApplying) setReviewOpen(false)
          }}
        >
          <div className={styles.reviewModal} role="dialog" aria-modal="true" aria-label="Untracked review">
            <div className={styles.reviewHeader}>
              <h3>Untracked File Review</h3>
              <button
                className={styles.reviewClose}
                onClick={() => setReviewOpen(false)}
                disabled={reviewApplying}
              >
                x
              </button>
            </div>

            {reviewError && <div className={styles.reviewError}>{reviewError}</div>}
            {reviewLoading && <div className={styles.reviewLoading}>Analyzing untracked files (can take up to ~45s for large sets)...</div>}

            {!reviewLoading && review && (
              <>
                <div className={styles.reviewSummary}>
                  <span>Total {review.total_untracked}</span>
                  <span>Commit {review.commit_count}</span>
                  <span>Delete {review.delete_count}</span>
                </div>

                <div className={styles.reviewList}>
                  {review.items.map((item) => (
                    <div key={item.path} className={styles.reviewRow}>
                      <div className={styles.reviewRowTop}>
                        <span className={styles.reviewPath}>{item.path}</span>
                        <span
                          className={`${styles.reviewBadge} ${
                            item.recommendation === 'delete' ? styles.badgeDelete : styles.badgeCommit
                          }`}
                        >
                          {item.recommendation}
                        </span>
                        <span className={styles.reviewConfidence}>
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className={styles.reviewReason}>{item.reason}</p>
                      {item.recommendation === 'delete' && (
                        <label className={styles.reviewCheck}>
                          <input
                            type="checkbox"
                            checked={deleteSelected.has(item.path)}
                            onChange={() => toggleDeleteSelection(item.path)}
                            disabled={reviewApplying}
                          />
                          Delete this file
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.reviewActions}>
                  <button
                    className={styles.reviewStageBtn}
                    onClick={handleStageRecommended}
                    disabled={reviewApplying}
                  >
                    Stage recommended commit files
                  </button>
                  <button
                    className={styles.reviewDeleteBtn}
                    onClick={() => void handleDeleteSelected()}
                    disabled={reviewApplying || deleteSelected.size === 0}
                  >
                    {reviewApplying ? 'Deleting...' : `Delete selected (${deleteSelected.size})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
