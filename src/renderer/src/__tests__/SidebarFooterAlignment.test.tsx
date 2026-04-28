// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GitHubStatus } from '../components/ConnectGitHub/ConnectGitHub'
import githubStyles from '../components/ConnectGitHub/ConnectGitHub.module.css'
import { Sidebar } from '../components/Sidebar/Sidebar'
import sidebarStyles from '../components/Sidebar/Sidebar.module.css'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    sidebarTitle: 'My Projects',
    addRepo: '+ Link a Project',
    noReposHint: 'No projects yet.\nClick "Link a Project" to get started.'
  })
}))

describe('sidebar footer alignment', () => {
  it('centers the Weekly Report footer button content', () => {
    render(
      <Sidebar
        projects={[]}
        activeProjectId={null}
        theme="dark"
        onSelectProject={vi.fn()}
        onRemoveProject={vi.fn()}
        onAddProject={vi.fn()}
        onToggleTheme={vi.fn()}
        onWeeklyReport={vi.fn()}
        weeklyReportActive={false}
      />
    )

    expect(screen.getByRole('button', { name: /Weekly Report/i }).className).toContain(
      sidebarStyles.centeredFooterButton
    )
  })

  it('centers the Connect GitHub sidebar button content', () => {
    render(<GitHubStatus connected={false} onConnect={vi.fn()} onDisconnect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Connect GitHub/i }).className).toContain(
      githubStyles.sidebarStatusCentered
    )
  })

  it('centers the connected GitHub status label content', () => {
    render(<GitHubStatus connected={true} onConnect={vi.fn()} onDisconnect={vi.fn()} />)

    expect(screen.getByText(/GitHub connected/i).className).toContain(githubStyles.connectedLabelCentered)
  })
})
