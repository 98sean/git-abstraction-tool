import { AiConnectionStatus, ProjectAiSettings, ProjectCloudTarget } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './ProjectSettingsPanel.module.css'

interface Props {
  aiSettings: ProjectAiSettings
  aiConnectionStatus: AiConnectionStatus
  selectedModel: string | null
  cloudTarget: ProjectCloudTarget
  protectedBranch: string | null
  onAiChange: (patch: Partial<ProjectAiSettings>) => void
  onOpenAiConnection: () => void
  onOpenCloudSetup: () => void
  onClose: () => void
}

function getCloudStatusLabel(
  cloudTarget: ProjectCloudTarget,
  labels: {
    privateBackupReadyLabel: string
    teamUploadReadyLabel: string
    cloudBackupNotSetUpLabel: string
  }
): string {
  if (cloudTarget.mode === 'backup') {
    return labels.privateBackupReadyLabel
  }

  if (cloudTarget.mode === 'collaboration') {
    return labels.teamUploadReadyLabel
  }

  return labels.cloudBackupNotSetUpLabel
}

export function ProjectSettingsPanel({
  aiSettings,
  aiConnectionStatus,
  selectedModel,
  cloudTarget,
  protectedBranch,
  onAiChange,
  onOpenAiConnection,
  onOpenCloudSetup,
  onClose
}: Props): JSX.Element {
  const t = useTerms()
  const connected = aiConnectionStatus === 'connected'
  const cloudStatusLabel = getCloudStatusLabel(cloudTarget, t)

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t.projectSettingsTitle}</h2>
          <p className={styles.description}>
            {t.projectSettingsDescription}
          </p>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t.closeProjectSettingsLabel}>
          ×
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t.aiSaveMessagesTitle}</h3>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={aiSettings.auto_save_message_enabled}
            disabled={!connected}
            onChange={(event) => onAiChange({ auto_save_message_enabled: event.target.checked })}
          />
          <span>{t.useAiAutoSaveMessagesLabel}</span>
        </label>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t.aiConnectionLabel}</span>
          <span>{connected ? t.aiConnectedLabel : t.aiConnectProviderFirstLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t.modelLabel}</span>
          <span>{selectedModel ?? t.noneSelectedLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t.diffConsentLabel}</span>
          <span>{aiSettings.ai_diff_consent_granted ? t.diffConsentGrantedLabel : t.diffConsentNotGrantedLabel}</span>
        </div>
        {!connected && (
          <button className={styles.secondaryBtn} onClick={onOpenAiConnection}>
            {t.openConnectAiBtn}
          </button>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t.cloudUploadTitle}</h3>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t.statusLabel}</span>
          <span>{cloudStatusLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t.defaultBranchLabel}</span>
          <span>{protectedBranch ? `${protectedBranch} (${t.protectedBranchSuffix})` : t.notDetectedYetLabel}</span>
        </div>
        {cloudTarget.mode === 'backup' && cloudTarget.backup && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>{t.repositoryLabel}</span>
            <span>
              {cloudTarget.backup.repoOwner}/{cloudTarget.backup.repoName}
            </span>
          </div>
        )}
        {cloudTarget.mode === 'collaboration' && cloudTarget.collaboration && (
          <>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>{t.remoteLabel}</span>
              <span>{cloudTarget.collaboration.remoteName}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>{t.branchLabel}</span>
              <span>{cloudTarget.collaboration.selectedBranch ?? t.notChosenLabel}</span>
            </div>
          </>
        )}
        <button className={styles.secondaryBtn} onClick={onOpenCloudSetup}>
          {cloudTarget.mode === 'none' ? t.setupCloudUploadBtn : t.changeUploadTargetBtn}
        </button>
      </div>
    </section>
  )
}
