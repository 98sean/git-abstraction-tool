import React from 'react'
import { invokeDb } from '../../ipc'
import { Project } from '../../types'
import { useTerms } from '../../hooks/useTerms'
import styles from './Sidebar.module.css'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  theme: 'light' | 'dark'
  mode?: 'newbie' | 'pro'
  language?: 'en' | 'ko'
  onSelectProject: (id: string) => void
  onRemoveProject: (id: string) => void
  onAddProject: () => void
  onToggleTheme: () => void
  onToggleMode?: () => void
  onToggleLanguage?: () => void
  onOpenSettings?: () => void
  onWeeklyReport?: () => void
  weeklyReportActive?: boolean
  /** Optional: dot colour hint per project — 'changed' | 'clean' | 'unknown' */
  projectStates?: Record<string, 'changed' | 'clean' | 'unknown'>
  /** Optional slot for rendering GitHub connection status in the footer */
  githubSlot?: React.ReactNode
  /** Optional slot for rendering AI connection status in the footer */
  aiSlot?: React.ReactNode
}

export function Sidebar({
  projects,
  activeProjectId,
  theme,
  mode,
  language,
  onSelectProject,
  onRemoveProject,
  onAddProject,
  onToggleTheme,
  onToggleMode,
  onToggleLanguage,
  onOpenSettings,
  onWeeklyReport,
  weeklyReportActive,
  projectStates = {},
  githubSlot,
  aiSlot
}: Props): JSX.Element {
  const t = useTerms()
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.appTitle}>{t.sidebarTitle}</span>
      </div>

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyHint}>
            {t.noReposHint.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
            ))}
          </div>
        ) : (
          projects.map((p) => {
            const dotState = projectStates[p.project_id] ?? 'unknown'
            return (
              <div
                key={p.project_id}
                className={`${styles.projectItem} ${p.project_id === activeProjectId ? styles.active : ''}`}
                onClick={() => onSelectProject(p.project_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectProject(p.project_id)}
              >
                <span className={styles.projectIcon}>📁</span>
                <span className={styles.projectName} title={p.local_path}>
                  {p.friendly_name}
                </span>
                <span className={`${styles.projectDot} ${styles[dotState]}`} />
                <button
                  className={styles.removeBtn}
                  onClick={(e) => { e.stopPropagation(); onRemoveProject(p.project_id) }}
                  title="Remove project"
                  aria-label={`Remove ${p.friendly_name}`}
                >
                  ×
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.linkBtn} onClick={onAddProject}>
          {t.addRepo}
        </button>
        {onWeeklyReport && (
          <button
            className={`${styles.weeklyReportBtn} ${styles.centeredFooterButton} ${weeklyReportActive ? styles.active : ''}`}
            onClick={onWeeklyReport}
          >
            {t.weeklyReportBtn}
          </button>
        )}
        {githubSlot}
        {aiSlot}
        {mode && onToggleMode && (
          <div className={styles.segmented}>
            <button
              className={`${styles.segOption} ${mode === 'newbie' ? styles.segActive : ''}`}
              onClick={mode !== 'newbie' ? onToggleMode : undefined}
            >
              {t.modeLabelNewbie}
            </button>
            <button
              className={`${styles.segOption} ${mode === 'pro' ? styles.segActive : ''}`}
              onClick={mode !== 'pro' ? onToggleMode : undefined}
            >
              {t.modeLabelPro}
            </button>
          </div>
        )}
        {language && onToggleLanguage && (
          <div className={styles.segmented}>
            <button
              className={`${styles.segOption} ${language === 'en' ? styles.segActive : ''}`}
              onClick={language !== 'en' ? onToggleLanguage : undefined}
            >
              EN
            </button>
            <button
              className={`${styles.segOption} ${language === 'ko' ? styles.segActive : ''}`}
              onClick={language !== 'ko' ? onToggleLanguage : undefined}
            >
              KO
            </button>
          </div>
        )}
        {onOpenSettings && (
          <button className={styles.settingsBtn} onClick={onOpenSettings}>
            {t.settingsBtn}
          </button>
        )}
        <div className={styles.segmented}>
          <button
            className={`${styles.segOption} ${theme === 'light' ? styles.segActive : ''}`}
            onClick={theme !== 'light' ? onToggleTheme : undefined}
          >
            {t.themeLabelLight}
          </button>
          <button
            className={`${styles.segOption} ${theme === 'dark' ? styles.segActive : ''}`}
            onClick={theme !== 'dark' ? onToggleTheme : undefined}
          >
            {t.themeLabelDark}
          </button>
        </div>
      </div>
    </aside>
  )
}

// Helper: open native folder dialog and return path or null
export async function pickFolder(): Promise<string | null> {
  return invokeDb<string | null>('dialog:openFolder')
}
