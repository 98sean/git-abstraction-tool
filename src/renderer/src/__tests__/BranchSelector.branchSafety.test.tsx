// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BranchSelector } from '../components/BranchSelector/BranchSelector'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    branchLabel: 'branch',
    branchMenuHelp: (name: string) => `${name}은 보호되어 삭제할 수 없습니다. 다른 branch는 Git이 허용할 때 삭제할 수 있습니다.`,
    protectedBranchSuffix: '보호됨',
    mergeBranchBtn: 'merge',
    deleteBranchBtn: '삭제',
    protectedBranchMsg: (name: string) => `"${name}" 브랜치는 보호되어 삭제할 수 없습니다.`,
    mergeBranchConfirm: (source: string, target: string) => `${source} -> ${target}`,
    mergeDefaultBranchConfirm: (source: string, target: string) => `${source} -> ${target} default`,
    branchPlaceholder: 'branch-name',
    newBranchBtn: '+ new branch'
  })
}))

describe('BranchSelector branch safety hints', () => {
  it('marks the protected branch and explains why it cannot be deleted', () => {
    render(
      <BranchSelector
        currentBranch="main"
        protectedBranch="main"
        branches={[
          { name: 'main', current: true },
          { name: 'gat/demo-update', current: false }
        ]}
        loading={false}
        onSwitch={vi.fn()}
        onCreate={vi.fn()}
        onMerge={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /main/i }))

    expect(screen.getByText(/main은 보호되어 삭제할 수 없습니다/i)).toBeTruthy()
    expect(screen.getByText('보호됨')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: '삭제' })[0].hasAttribute('disabled')).toBe(true)
  })
})
