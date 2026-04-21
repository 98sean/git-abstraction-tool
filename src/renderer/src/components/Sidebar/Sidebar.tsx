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
  onSelectProject: (id: string) => void
  onRemoveProject: (id: string) => void
  onAddProject: () => void
  onToggleTheme: () => void
  onToggleMode?: () => void
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
  onSelectProject,
  onRemoveProject,
  onAddProject,
  onToggleTheme,
  onToggleMode,
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
            className={`${styles.weeklyReportBtn} ${weeklyReportActive ? styles.active : ''}`}
            onClick={onWeeklyReport}
          >
            📊 Weekly Report
          </button>
        )}
        {githubSlot}
        {aiSlot}
        {mode && onToggleMode && (
          <button className={styles.modeBtn} onClick={onToggleMode}>
            {mode === 'pro' ? '👤 Switch to Newbie Mode' : '⚡ Switch to Pro Mode'}
          </button>
        )}
        {onOpenSettings && (
          <button className={styles.settingsBtn} onClick={onOpenSettings}>
            ⚙ Settings
          </button>
        )}
        <button className={styles.themeBtn} onClick={onToggleTheme}>
          {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
        </button>
      </div>
    </aside>
  )
}

// Helper: open native folder dialog and return path or null
export async function pickFolder(): Promise<string | null> {
  return invokeDb<string | null>('dialog:openFolder')
}
