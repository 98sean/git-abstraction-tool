import { ProjectFolderInspection } from '../../types'
import { useTerms } from '../../hooks/useTerms'
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
  const t = useTerms()
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
            <p className={styles.eyebrow}>{t.linkProjectEyebrow}</p>
            <h2 id="project-link-wizard-title" className={styles.title}>
              {currentStep === 'choose' && t.linkChooseTitle}
              {currentStep === 'prepare' && t.linkPrepareTitle}
              {currentStep === 'warnings' && t.linkWarningsTitle}
              {currentStep === 'review' && t.linkReviewTitle}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onCancel} aria-label={t.linkCloseLabel}>
            ×
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {folderPath && (
          <div className={styles.folderCard}>
            <span className={styles.folderLabel}>{friendlyName || t.linkSelectedFolderLabel}</span>
            <span className={styles.folderPath}>{folderPath}</span>
          </div>
        )}

        {currentStep === 'choose' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.linkChooseCopy}
            </p>
            <button
              className={styles.primaryButton}
              onClick={onChooseFolder}
              disabled={loading || !onChooseFolder}
            >
              {loading ? t.linkCheckingFolderBtn : t.linkChooseFolderBtn}
            </button>
          </div>
        )}

        {currentStep === 'prepare' && inspection && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.linkPrepareCopy}
            </p>
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                {t.cancelBtn}
              </button>
              <button className={styles.primaryButton} onClick={onApproveInit} disabled={loading}>
                {t.linkApproveInitBtn}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'warnings' && inspection && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.linkWarningsCopy}
            </p>
            <ul className={styles.warningList}>
              {inspection.warnings.map((warning) => (
                <li key={`${warning.kind}-${warning.path}`} className={styles.warningItem}>
                  <div>
                    <strong>{warning.path}</strong>
                    <p>{t.linkWarningReason(warning.kind, warning.reason)}</p>
                  </div>
                  {inspection.recommendedIgnoreEntries.includes(warning.path) && onToggleIgnoreEntry && (
                    <label className={styles.ignoreOption}>
                      <input
                        type="checkbox"
                        checked={selectedIgnoreEntries.includes(warning.path)}
                        onChange={() => onToggleIgnoreEntry(warning.path)}
                      />
                      {t.linkExcludeLabel}
                    </label>
                  )}
                </li>
              ))}
            </ul>
            {inspection.recommendedIgnoreEntries.length > 0 && (
              <div className={styles.recommendationBox}>
                <span>{t.linkRecommendedExcludesLabel}</span>
                <code>{selectedIgnoreEntries.join(', ') || t.noneSelectedLabel}</code>
              </div>
            )}
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                {t.cancelBtn}
              </button>
              <button className={styles.primaryButton} onClick={onFinish} disabled={loading}>
                {t.linkFinishBtn}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.linkReviewCopy}
            </p>
            {inspection && inspection.remotes.length > 0 && (
              <div className={styles.recommendationBox}>
                <span>{t.linkDetectedRemotesLabel}</span>
                <code>{inspection.remotes.map((remote) => remote.name).join(', ')}</code>
              </div>
            )}
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onCancel}>
                {t.cancelBtn}
              </button>
              <button className={styles.primaryButton} onClick={onFinish} disabled={loading}>
                {loading ? t.linkLinkingBtn : t.linkFinishBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
