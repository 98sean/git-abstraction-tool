import { ProjectFolderInspection } from '../../types'
import styles from './ProjectLinkWizard.module.css'

interface Props {
  step?: 'choose' | 'prepare' | 'warnings' | 'review'
  inspection?: ProjectFolderInspection | null
  folderPath?: string | null
  friendlyName?: string
  loading?: boolean
  error?: string | null
  selectedIgnoreEntries?: string[]
  onChooseFolder?: () => void
  onToggleIgnoreEntry?: (entry: string) => void
  onApproveInit: () => void
  onCancel: () => void
  onFinish: () => void
}

function deriveStep(
  step: Props['step'],
  inspection?: ProjectFolderInspection | null
): 'choose' | 'prepare' | 'warnings' | 'review' {
  if (step) return step
  if (!inspection) return 'choose'
  if (!inspection.isGitRepo && inspection.canInitialize) return 'prepare'
  if (inspection.warnings.length > 0) return 'warnings'
  return 'review'
}

export function ProjectLinkWizard({
  step,
  inspection,
  folderPath,
  friendlyName,
  loading = false,
  error = null,
  selectedIgnoreEntries = inspection?.recommendedIgnoreEntries ?? [],
  onChooseFolder,
  onToggleIgnoreEntry,
  onApproveInit,
  onCancel,
  onFinish
}: Props): JSX.Element {
  const currentStep = deriveStep(step, inspection)

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-link-wizard-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Link A Project</p>
            <h2 id="project-link-wizard-title" className={styles.title}>
              {currentStep === 'choose' && 'Choose a project folder'}
              {currentStep === 'prepare' && 'Turn on change history'}
              {currentStep === 'warnings' && 'Review folder warnings'}
              {currentStep === 'review' && 'Finish linking'}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onCancel} aria-label="Close link wizard">
            ×
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {folderPath && (
          <div className={styles.folderCard}>
            <span className={styles.folderLabel}>{friendlyName || 'Selected folder'}</span>
            <span className={styles.folderPath}>{folderPath}</span>
          </div>
        )}

        {currentStep === 'choose' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              We will check whether this folder is ready for local save history before we link it.
            </p>
            <button
              className={styles.primaryButton}
              onClick={onChooseFolder}
              disabled={loading || !onChooseFolder}
            >
              {loading ? 'Checking folder...' : 'Choose folder'}
            </button>
          </div>
        )}

        {currentStep === 'prepare' && inspection && (
          <div className={styles.section}>
            <p className={styles.copy}>
              This folder is not using Git yet. Turning on change history keeps saves local and does
              not upload anything to GitHub.
            </p>
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                Cancel
              </button>
              <button className={styles.primaryButton} onClick={onApproveInit} disabled={loading}>
                Turn it on and continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 'warnings' && inspection && (
          <div className={styles.section}>
            <p className={styles.copy}>
              We found files that may be better excluded before the project starts saving history.
            </p>
            <ul className={styles.warningList}>
              {inspection.warnings.map((warning) => (
                <li key={`${warning.kind}-${warning.path}`} className={styles.warningItem}>
                  <div>
                    <strong>{warning.path}</strong>
                    <p>{warning.reason}</p>
                  </div>
                  {inspection.recommendedIgnoreEntries.includes(warning.path) && onToggleIgnoreEntry && (
                    <label className={styles.ignoreOption}>
                      <input
                        type="checkbox"
                        checked={selectedIgnoreEntries.includes(warning.path)}
                        onChange={() => onToggleIgnoreEntry(warning.path)}
                      />
                      Exclude
                    </label>
                  )}
                </li>
              ))}
            </ul>
            {inspection.recommendedIgnoreEntries.length > 0 && (
              <div className={styles.recommendationBox}>
                <span>Recommended excludes</span>
                <code>{selectedIgnoreEntries.join(', ') || 'None selected'}</code>
              </div>
            )}
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                Cancel
              </button>
              <button className={styles.primaryButton} onClick={onFinish} disabled={loading}>
                Finish linking
              </button>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              This folder is ready. We will register it and start local file watching right away.
            </p>
            {inspection && inspection.remotes.length > 0 && (
              <div className={styles.recommendationBox}>
                <span>Detected remotes</span>
                <code>{inspection.remotes.map((remote) => remote.name).join(', ')}</code>
              </div>
            )}
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                Cancel
              </button>
              <button className={styles.primaryButton} onClick={onFinish} disabled={loading}>
                {loading ? 'Linking project...' : 'Finish linking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
