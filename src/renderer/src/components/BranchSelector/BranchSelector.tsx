import { useEffect, useRef, useState } from 'react'
import { BranchInfo } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './BranchSelector.module.css'

interface Props {
  currentBranch: string
  protectedBranch: string | null
  branches: BranchInfo[]
  loading: boolean
  onSwitch: (name: string) => Promise<void>
  onCreate: (name: string) => Promise<void>
  onMerge: (name: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
}

export function BranchSelector({
  currentBranch,
  protectedBranch,
  branches,
  loading,
  onSwitch,
  onCreate,
  onMerge,
  onDelete
}: Props): JSX.Element {
  const t = useTerms()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSwitch = async (name: string): Promise<void> => {
    if (name === currentBranch || busy) return
    setBusy(true)
    try {
      await onSwitch(name)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const handleCreate = async (): Promise<void> => {
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      await onCreate(name)
      setNewName('')
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (name: string): Promise<void> => {
    if (busy) return
    if (protectedBranch && name === protectedBranch) return
    setBusy(true)
    try {
      await onDelete(name)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const handleMerge = async (name: string): Promise<void> => {
    if (name === currentBranch || busy) return
    if (!window.confirm(t.mergeBranchConfirm(name, currentBranch))) return
    if (protectedBranch && currentBranch === protectedBranch &&
      !window.confirm(t.mergeDefaultBranchConfirm(name, currentBranch))
    ) {
      return
    }
    setBusy(true)
    try {
      await onMerge(name)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${styles.pill} ${open ? styles.pillOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={`${t.branchLabel}: ${currentBranch}`}
        disabled={loading}
      >
        <span className={styles.icon}>⑂</span>
        <span className={styles.name}>{currentBranch}</span>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>{t.branchLabel}</div>

          <div className={styles.list}>
            {branches.length === 0 ? (
              <div className={styles.emptyBranches}>No branches found</div>
            ) : (
              branches.map((b) => (
                <div
                  key={b.name}
                  className={`${styles.branchRow} ${b.current ? styles.current : ''}`}
                >
                  <button
                    className={styles.branchItem}
                    onClick={() => handleSwitch(b.name)}
                    disabled={busy}
                  >
                    <span className={styles.check}>{b.current ? '✓' : ''}</span>
                    <span className={styles.branchName}>{b.name}</span>
                  </button>
                  <div className={styles.rowActions}>
                    {!b.current && (
                      <button
                        className={styles.mergeBtn}
                        onClick={() => void handleMerge(b.name)}
                        disabled={busy}
                        title={t.mergeBranchBtn}
                      >
                        {t.mergeBranchBtn}
                      </button>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => void handleDelete(b.name)}
                      disabled={busy || (protectedBranch ? b.name === protectedBranch : false)}
                      title={
                        protectedBranch && b.name === protectedBranch
                          ? t.protectedBranchMsg(protectedBranch)
                          : t.deleteBranchBtn
                      }
                    >
                      {t.deleteBranchBtn}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.newBranchRow}>
            <input
              className={styles.newBranchInput}
              type="text"
              placeholder={t.branchPlaceholder}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              spellCheck={false}
            />
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={!newName.trim() || busy}
            >
              {t.newBranchBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
