import { AiConnectionStatus, ProjectAiSettings, ProjectCloudTarget } from '../../types'
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

function getCloudStatusLabel(cloudTarget: ProjectCloudTarget): string {
  if (cloudTarget.mode === 'backup') {
    return 'Private backup ready'
  }

  if (cloudTarget.mode === 'collaboration') {
    return 'Team upload ready'
  }

  return 'Cloud backup not set up yet'
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
  const connected = aiConnectionStatus === 'connected'
  const cloudStatusLabel = getCloudStatusLabel(cloudTarget)

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Project Settings</h2>
          <p className={styles.description}>
            Review AI save-message options and cloud upload status for this project.
          </p>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close project settings">
          ×
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>AI Save Messages</h3>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={aiSettings.auto_save_message_enabled}
            disabled={!connected}
            onChange={(event) => onAiChange({ auto_save_message_enabled: event.target.checked })}
          />
          <span>Use AI auto save messages</span>
        </label>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Connection</span>
          <span>{connected ? 'Connected' : 'Connect a provider first'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Model</span>
          <span>{selectedModel ?? 'None selected'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Diff consent</span>
          <span>{aiSettings.ai_diff_consent_granted ? 'Granted' : 'Not granted yet'}</span>
        </div>
        {!connected && (
          <button className={styles.secondaryBtn} onClick={onOpenAiConnection}>
            Open Connect AI
          </button>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cloud Upload</h3>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Status</span>
          <span>{cloudStatusLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Default branch</span>
          <span>{protectedBranch ? `${protectedBranch} (protected)` : 'Not detected yet'}</span>
        </div>
        {cloudTarget.mode === 'backup' && cloudTarget.backup && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Repository</span>
            <span>
              {cloudTarget.backup.repoOwner}/{cloudTarget.backup.repoName}
            </span>
          </div>
        )}
        {cloudTarget.mode === 'collaboration' && cloudTarget.collaboration && (
          <>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Remote</span>
              <span>{cloudTarget.collaboration.remoteName}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Branch</span>
              <span>{cloudTarget.collaboration.selectedBranch ?? 'Not chosen'}</span>
            </div>
          </>
        )}
        <button className={styles.secondaryBtn} onClick={onOpenCloudSetup}>
          {cloudTarget.mode === 'none' ? 'Set up cloud upload' : 'Change upload target'}
        </button>
      </div>
    </section>
  )
}
