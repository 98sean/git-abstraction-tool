// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../components/Sidebar/Sidebar'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    sidebarTitle: 'My Projects',
    addRepo: '+ Link a Project',
    noReposHint: 'No projects yet.\nClick "Link a Project" to get started.'
  })
}))

describe('Sidebar language selector', () => {
  it('lets the user choose Korean language', () => {
    const onToggleLanguage = vi.fn()

    render(
      <Sidebar
        projects={[]}
        activeProjectId={null}
        theme="light"
        mode="newbie"
        language="en"
        projectStates={{}}
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
        onRemoveProject={vi.fn()}
        onToggleTheme={vi.fn()}
        onToggleMode={vi.fn()}
        onToggleLanguage={onToggleLanguage}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /한국어/i }))
    expect(onToggleLanguage).toHaveBeenCalled()
  })
})
