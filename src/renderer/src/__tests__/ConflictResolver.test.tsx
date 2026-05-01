// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictResolver } from '../components/ConflictResolver/ConflictResolver'
import { FileStatus } from '../types'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    conflictResolverTitle: 'Resolve Conflicts',
    conflictResolverDesc: 'Choose which version to keep for each file.',
    keepMineBtn: 'Keep Mine',
    keepTheirsBtn: 'Keep Theirs',
    resolvedLabel: 'Resolved',
    abortMergeBtn: 'Abort merge',
    completeMergeBtn: 'Complete merge',
    conflictMergeCommitMessage: 'Merge branch'
  })
}))

function makeFile(path: string): FileStatus {
  return { path, status: 'conflicted', staged: false }
}

const twoFiles = [makeFile('src/alpha.ts'), makeFile('src/beta.ts')]

function renderResolver(
  files: FileStatus[] = twoFiles,
  overrides: Partial<{
    onResolve: (path: string, strategy: 'ours' | 'theirs') => Promise<void>
    onAbort: () => Promise<void>
    onComplete: (msg: string) => Promise<void>
    onClose: () => void
  }> = {}
) {
  const props = {
    conflictedFiles: files,
    onResolve: vi.fn().mockResolvedValue(undefined),
    onAbort: vi.fn().mockResolvedValue(undefined),
    onComplete: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    ...overrides
  }
  render(<ConflictResolver {...props} />)
  return props
}

describe('ConflictResolver', () => {
  afterEach(cleanup)

  // AC 7: title and description rendered
  it('renders title and description', () => {
    renderResolver()
    expect(screen.getByText('Resolve Conflicts')).toBeTruthy()
    expect(screen.getByText(/Choose which version to keep/i)).toBeTruthy()
  })

  // AC 8: one row per file
  it('renders a row for each conflicted file', () => {
    renderResolver()
    expect(screen.getByText('src/alpha.ts')).toBeTruthy()
    expect(screen.getByText('src/beta.ts')).toBeTruthy()
  })

  // AC 9: Keep Mine / Keep Theirs buttons shown per file
  it('shows Keep Mine and Keep Theirs for each unresolved file', () => {
    renderResolver()
    expect(screen.getAllByRole('button', { name: 'Keep Mine' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Keep Theirs' })).toHaveLength(2)
  })

  // AC 10: clicking Keep Mine calls onResolve with 'ours'
  it('calls onResolve with ours when Keep Mine is clicked', async () => {
    const { onResolve } = renderResolver()
    fireEvent.click(screen.getAllByRole('button', { name: 'Keep Mine' })[0])
    await waitFor(() => expect(onResolve).toHaveBeenCalledWith('src/alpha.ts', 'ours'))
  })

  // AC 11: clicking Keep Theirs calls onResolve with 'theirs'
  it('calls onResolve with theirs when Keep Theirs is clicked', async () => {
    const { onResolve } = renderResolver()
    fireEvent.click(screen.getAllByRole('button', { name: 'Keep Theirs' })[0])
    await waitFor(() => expect(onResolve).toHaveBeenCalledWith('src/alpha.ts', 'theirs'))
  })

  // AC 12: resolved file shows badge instead of buttons
  it('shows Resolved badge after a file is resolved', async () => {
    renderResolver()
    fireEvent.click(screen.getAllByRole('button', { name: 'Keep Mine' })[0])
    await waitFor(() => expect(screen.getByText('Resolved')).toBeTruthy())
    // buttons for resolved file are gone; only one set remains for beta.ts
    expect(screen.getAllByRole('button', { name: 'Keep Mine' })).toHaveLength(1)
  })

  // AC 14 + AC 15: complete area and Complete merge button appear only when all resolved
  it('shows the complete area only after all files are resolved', async () => {
    renderResolver()
    expect(screen.queryByRole('button', { name: 'Complete merge' })).toBeNull()

    // resolve first file
    fireEvent.click(screen.getAllByRole('button', { name: 'Keep Mine' })[0])
    await waitFor(() => expect(screen.getAllByText('Resolved')).toHaveLength(1))
    expect(screen.queryByRole('button', { name: 'Complete merge' })).toBeNull()

    // resolve second file
    fireEvent.click(screen.getAllByRole('button', { name: 'Keep Mine' })[0])
    await waitFor(() => expect(screen.getAllByText('Resolved')).toHaveLength(2))

    expect(screen.getByRole('button', { name: 'Complete merge' })).toBeTruthy()
  })

  // AC 16: Complete merge disabled when message is empty
  it('disables Complete merge when the commit message is empty', async () => {
    renderResolver([makeFile('src/only.ts')])
    fireEvent.click(screen.getByRole('button', { name: 'Keep Mine' }))
    await waitFor(() => expect(screen.getByText('Resolved')).toBeTruthy())

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '' } })

    expect((screen.getByRole('button', { name: 'Complete merge' }) as HTMLButtonElement).disabled).toBe(true)
  })

  // AC 15: clicking Complete merge calls onComplete with trimmed message
  it('calls onComplete with the commit message when Complete merge is clicked', async () => {
    const { onComplete } = renderResolver([makeFile('src/only.ts')])
    fireEvent.click(screen.getByRole('button', { name: 'Keep Mine' }))
    await waitFor(() => expect(screen.getByText('Resolved')).toBeTruthy())

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '  Merge feature branch  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Complete merge' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Merge feature branch'))
  })

  // AC 17: Enter key in commit input triggers completion
  it('submits on Enter key in the commit message input', async () => {
    const { onComplete } = renderResolver([makeFile('src/only.ts')])
    fireEvent.click(screen.getByRole('button', { name: 'Keep Mine' }))
    await waitFor(() => expect(screen.getByText('Resolved')).toBeTruthy())

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Merge branch' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Merge branch'))
  })

  // AC 18: Abort merge always visible and calls onAbort
  it('always shows Abort merge and calls onAbort when clicked', async () => {
    const { onAbort, onClose } = renderResolver()
    expect(screen.getByRole('button', { name: 'Abort merge' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abort merge' }))
    await waitFor(() => expect(onAbort).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  // AC 19: close button calls onClose
  it('calls onClose when the × button is clicked', () => {
    const { onClose } = renderResolver()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
