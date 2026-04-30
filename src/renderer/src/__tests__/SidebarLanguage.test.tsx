// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../components/Sidebar/Sidebar'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    sidebarTitle: 'My Projects',
    addRepo: '+ Link a Project',
    noReposHint: 'No projects yet.\nClick "Link a Project" to get started.',
    modeToggleBtn: () => '전문 용어로 보기',
    languageToggleBtn: () => '한국어',
    themeToggleBtn: () => '다크 모드',
    weeklyReportBtn: '주간 리포트',
    settingsBtn: '설정'
  })
}))

describe('Sidebar language selector', () => {
  afterEach(() => {
    cleanup()
  })

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

  it('renders localized footer controls from terms', () => {
    render(
      <Sidebar
        projects={[]}
        activeProjectId={null}
        theme="light"
        mode="newbie"
        language="ko"
        projectStates={{}}
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
        onRemoveProject={vi.fn()}
        onToggleTheme={vi.fn()}
        onToggleMode={vi.fn()}
        onToggleLanguage={vi.fn()}
        onOpenSettings={vi.fn()}
        onWeeklyReport={vi.fn()}
        weeklyReportActive={false}
      />
    )

    expect(screen.getByRole('button', { name: '전문 용어로 보기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '주간 리포트' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '설정' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '다크 모드' })).toBeTruthy()
  })
})
