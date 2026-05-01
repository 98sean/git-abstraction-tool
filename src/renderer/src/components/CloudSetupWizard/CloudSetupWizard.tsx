import { useState } from 'react'
import { validateBranchName } from '../../branchValidation'
import { useTerms } from '../../hooks/useTerms'
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
  const t = useTerms()
  const [showDangerOptions, setShowDangerOptions] = useState(false)
  const [branchError, setBranchError] = useState<string | null>(null)

  const shownError = error ?? branchError

  function handleBranchChange(nextBranch: string): void {
    setBranchError(null)
    onSelectBranch?.(nextBranch)
  }

  function handleContinueCollaboration(): void {
    const branchValidation = validateBranchName(selectedBranch)
    if (!branchValidation.ok) {
      setBranchError(branchValidation.message)
      return
    }

    setBranchError(null)
    onContinueCollaboration?.()
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cloud-setup-title">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t.cloudSetupEyebrow}</p>
            <h2 id="cloud-setup-title" className={styles.title}>
              {intent ? t.cloudSetupSafeTitle : t.cloudSetupTitle}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label={t.closeCloudSetupLabel}>
            ×
          </button>
        </div>

        {shownError && <div className={styles.errorBanner}>{shownError}</div>}

        {!intent && (
          <div className={styles.intentGrid}>
            <button className={styles.intentCard} onClick={() => onChooseIntent('backup')}>
              <span className={styles.intentTitle}>{t.backupIntentTitle}</span>
              <span className={styles.intentCopy}>
                {t.backupIntentCopy}
              </span>
            </button>

            <button className={styles.intentCard} onClick={() => onChooseIntent('collaboration')}>
              <span className={styles.intentTitle}>{t.teamIntentTitle}</span>
              <span className={styles.intentCopy}>
                {t.teamIntentCopy}
              </span>
            </button>
          </div>
        )}

        {intent === 'backup' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.backupSetupCopy}
            </p>
            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onClose}>
                {t.cancelBtn}
              </button>
              <button className={styles.primaryButton} onClick={onCreateBackup} disabled={loading}>
                {loading ? t.creatingBackupBtn : t.createPrivateBackupBtn}
              </button>
            </div>
          </div>
        )}

        {intent === 'collaboration' && (
          <div className={styles.section}>
            <p className={styles.copy}>
              {t.teamSetupCopy}
            </p>

            <label className={styles.field}>
              <span>{t.teamRemoteLabel}</span>
              <select
                className={styles.select}
                value={selectedRemoteName}
                onChange={(event) => onSelectRemote?.(event.target.value)}
                disabled={loading || remotes.length === 0}
              >
                {remotes.length === 0 && <option value="">{t.noRemotesFoundLabel}</option>}
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
                <strong>{t.createWorkBranchTitle}</strong>
                <span>{t.createWorkBranchCopy}</span>
              </button>

              <button
                type="button"
                className={`${styles.modeCard} ${branchMode === 'existing_branch' ? styles.activeMode : ''}`}
                onClick={() => onSelectBranchMode?.('existing_branch')}
              >
                <strong>{t.existingBranchTitle}</strong>
                <span>{t.existingBranchCopy}</span>
              </button>

              {!showDangerOptions && (
                <button
                  type="button"
                  className={styles.revealDangerButton}
                  onClick={() => setShowDangerOptions(true)}
                >
                  {t.showRiskyOptionBtn}
                </button>
              )}

              {showDangerOptions && (
                <button
                  type="button"
                  className={`${styles.modeCard} ${styles.dangerMode} ${branchMode === 'danger_default_branch' ? styles.activeMode : ''}`}
                  onClick={() => onSelectBranchMode?.('danger_default_branch')}
                >
                  <strong>{t.defaultBranchUploadTitle}</strong>
                  <span>{t.defaultBranchUploadCopy}</span>
                </button>
              )}
            </div>

            <label className={styles.field}>
              <span>{branchMode === 'new_branch' ? t.workBranchNameLabel : t.uploadBranchNameLabel}</span>
              <input
                className={styles.input}
                value={selectedBranch}
                onChange={(event) => handleBranchChange(event.target.value)}
                placeholder={branchMode === 'new_branch' ? t.workBranchPlaceholder : t.uploadBranchPlaceholder}
              />
              {branchMode === 'new_branch' && (
                <span className={styles.fieldHelp}>{t.workBranchHelpText}</span>
              )}
            </label>

            <div className={styles.buttonRow}>
              <button className={styles.secondaryButton} onClick={onClose}>
                {t.cancelBtn}
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleContinueCollaboration}
                disabled={loading || remotes.length === 0}
              >
                {loading ? t.savingTargetBtn : t.saveTeamTargetBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
