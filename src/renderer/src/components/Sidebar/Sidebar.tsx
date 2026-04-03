import React from 'react'
import { invokeDb } from '../../ipc'
import { Project } from '../../types'
import styles from './Sidebar.module.css'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  theme: 'light' | 'dark'
  onSelectProject: (id: string) => void
  onRemoveProject: (id: string) => void
  onAddProject: () => void
  onToggleTheme: () => void
  /** Optional: dot colour hint per project — 'changed' | 'clean' | 'unknown' */
  projectStates?: Record<string, 'changed' | 'clean' | 'unknown'>
  /** Optional slot for rendering GitHub connection status in the footer */
  githubSlot?: React.ReactNode
}

export function Sidebar({
  projects,
  activeProjectId,
  theme,
  onSelectProject,
  onRemoveProject,
  onAddProject,
  onToggleTheme,
  projectStates = {},
  githubSlot
}: Props): JSX.Element {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.appTitle}>My Projects</span>
      </div>

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyHint}>
            No projects yet.
            <br />
            Click "Link a Project" to get started.
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
          + Link a Project
        </button>
        {githubSlot}
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
