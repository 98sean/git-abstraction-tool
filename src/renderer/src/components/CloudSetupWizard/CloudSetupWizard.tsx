import { useState } from 'react'
import { CloudSetupIntent, CollaborationBranchMode, ProjectRemote } from '../../types'
import styles from './CloudSetupWizard.module.css'

interface Props {
  intent?: CloudSetupIntent | null
  loading?: boolean
  error?: string | null
  remotes?: ProjectRemote[]
  branchMode?: CollaborationBranchMode
  selectedRemoteName?: string
  selectedBranch?: string
  onChooseIntent: (intent: CloudSetupIntent) => void
  onClose: () => void
  onCreateBackup?: () => void
  onSelectRemote?: (remoteName: string) => void
  onSelectBranchMode?: (branchMode: CollaborationBranchMode) => void
  onSelectBranch?: (branchName: string) => void
  onContinueCollaboration?: () => void
}

export function CloudSetupWizard({
  intent = null,
  loading = false,
  error = null,
  remotes = [],
  branchMode = 'new_branch',
  selectedRemoteName = '',
  selectedBranch = '',
  onChooseIntent,
  onClose,
  onCreateBackup,
  onSelectRemote,
  onSelectBranchMode,
  onSelectBranch,
  onContinueCollaboration
}: Props): JSX.Element {
  const [showDangerOptions, setShowDangerOptions] = useState(false)

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cloud-setup-title">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Upload To Cloud</p>
            <h2 id="cloud-setup-title" className={styles.title}>
              {intent ? 'Choose a safe upload setup' : 'How should this project upload?'}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close cloud setup">
            ×
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {!intent && (
          <div className={styles.intentGrid}>
            <button className={styles.intentCard} onClick={() => onChooseIntent('backup')}>
              <span className={styles.intentTitle}>Back up to my GitHub</span>
              <span className={styles.intentCopy}>
                Create a new private backup repository that this app manages for you.
              </span>
            </button>

            <button className={styles.intentCard} onClick={() => onChooseIntent('collaboration')}>
              <span className={styles.intentTitle}>Upload work to a team repository</span>
              <span className={styles.intentCopy}>
                Choose a remote and a safe branch strategy before sending work to the team repo.
              </span>
            </button>
          </div>
        )}

        {intent === 'backup' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              We will create a new private GitHub repository and use it as this project&apos;s backup
              destination.
            </p>
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onClose}>
                Cancel
              </button>
              <button className={styles.primaryButton} onClick={onCreateBackup} disabled={loading}>
                {loading ? 'Creating backup...' : 'Create private backup'}
              </button>
            </div>
          </div>
        )}

        {intent === 'collaboration' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              Team uploads stay inactive until you choose exactly which remote and branch this project
              should use.
            </p>

            <label className={styles.field}>
              <span>Team remote</span>
              <select
                className={styles.select}
                value={selectedRemoteName}
                onChange={(event) => onSelectRemote?.(event.target.value)}
                disabled={loading || remotes.length === 0}
              >
                {remotes.length === 0 && <option value="">No remotes found</option>}
                {remotes.map((remote) => (
                  <option key={remote.name} value={remote.name}>
                    {remote.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.modeList}>
              <button
                type="button"
                className={`${styles.modeCard} ${branchMode === 'new_branch' ? styles.activeMode : ''}`}
                onClick={() => onSelectBranchMode?.('new_branch')}
              >
                <strong>Create a new work branch</strong>
                <span>Recommended. Push a fresh branch first, then open GitHub for review.</span>
              </button>

              <button
                type="button"
                className={`${styles.modeCard} ${branchMode === 'existing_branch' ? styles.activeMode : ''}`}
                onClick={() => onSelectBranchMode?.('existing_branch')}
              >
                <strong>Use an existing non-default branch</strong>
                <span>Choose a remote branch that is already safe for team uploads.</span>
              </button>

              {!showDangerOptions && (
                <button
                  type="button"
                  className={styles.revealDangerButton}
                  onClick={() => setShowDangerOptions(true)}
                >
                  Show risky option
                </button>
              )}

              {showDangerOptions && (
                <button
                  type="button"
                  className={`${styles.modeCard} ${styles.dangerMode} ${branchMode === 'danger_default_branch' ? styles.activeMode : ''}`}
                  onClick={() => onSelectBranchMode?.('danger_default_branch')}
                >
                  <strong>Upload directly to the default branch</strong>
                  <span>This can update the team&apos;s main branch without review.</span>
                </button>
              )}
            </div>

            <label className={styles.field}>
              <span>{branchMode === 'new_branch' ? 'Work branch name' : 'Branch name to upload'}</span>
              <input
                className={styles.input}
                value={selectedBranch}
                onChange={(event) => onSelectBranch?.(event.target.value)}
                placeholder={branchMode === 'new_branch' ? 'gat/my-update' : 'main'}
              />
            </label>

            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={onContinueCollaboration}
                disabled={loading || remotes.length === 0}
              >
                {loading ? 'Saving target...' : 'Save team upload target'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
