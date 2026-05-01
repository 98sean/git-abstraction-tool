// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionPanel } from '../components/ActionPanel/ActionPanel'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    commitPlaceholder: () => '변경 내용을 설명하세요...',
    commitBtn: (count: number) => `진행 상황 저장${count > 0 ? ` (${count})` : ''}`,
    committingBtn: '저장 중...',
    pushBtn: '올리기',
    pullBtn: '업데이트 받기',
    pushTitle: '클라우드에 올리기',
    pullTitle: '업데이트 받기',
    filesStaged: (n: number) => `${n}개 선택됨`,
    toPush: (n: number) => `${n}개 올릴 항목`,
    toPull: (n: number) => `${n}개 받을 항목`,
    conflictMsg: '충돌 감지됨',
    dismissErrorLabel: '에러 닫기',
    authFailedConnectLabel: 'GitHub 연결',
    aiSuggestBtn: 'AI 제안',
    aiSuggestTitle: 'AI 저장 메시지 제안',
    aiDraftReady: 'AI 초안 준비됨',
    aiDraftFailed: 'AI 초안 실패',
    draftingBtn: '작성 중...',
    thinkingBtn: '생각 중...',
    uploadedBranch: (branchName: string) => `${branchName} 업로드됨`,
    openPullRequest: 'PR 열기',
    naturalUndoTitle: '자연어 되돌리기',
    aiConnectionRequired: 'AI 연결 필요',
    cancelNaturalUndoLabel: '취소',
    naturalUndoPlaceholder: '예: 어제 오후로 되돌리기',
    naturalUndoAnalyzingBtn: '분석 중...',
    naturalUndoFindBtn: '지점 찾기',
    confidenceLabel: (percent: string) => `신뢰도 ${percent}%`,
    restoreFiles: (count: number) => `${count}개 복원`,
    removeFiles: (count: number) => `${count}개 제거`,
    restoreFilePrefix: '복원',
    removeFilePrefix: '제거',
    restoringBtn: '복원 중...',
    restorePointBtn: '이 지점으로 복원',
    alternativeMatchesLabel: '다른 후보:',
    gitErrorMessage: (code: string, fallback: string) =>
      code === 'BRANCH_EXISTS'
        ? '이미 같은 이름의 branch가 있습니다. 다른 새 branch 이름을 쓰거나 기존 branch 모드를 선택하세요.'
        : fallback
  })
}))

describe('ActionPanel localized errors', () => {
  it('uses the active language message for git errors', () => {
    render(
      <ActionPanel
        status={{
          current_branch: 'main',
          files: [],
          tracked_files: [],
          ahead: 1,
          behind: 0,
          has_conflicts: false,
          is_clean: false
        }}
        loading={false}
        aiLoading={false}
        error={{
          code: 'BRANCH_EXISTS',
          message:
            'A branch with that name already exists. Use a different new branch name or choose existing branch mode.'
        }}
        message=""
        tokenExists={true}
        cloudUploadReady={true}
        naturalUndoEnabled={false}
        naturalUndoSuggestion={null}
        naturalUndoLoading={false}
        naturalUndoApplying={false}
        naturalUndoError={null}
        onMessageChange={vi.fn()}
        onCommit={vi.fn()}
        onSuggestMessage={vi.fn()}
        onPush={vi.fn()}
        onPull={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClearError={vi.fn()}
        onOpenGitHubConnect={vi.fn()}
      />
    )

    expect(screen.getByText(/이미 같은 이름의 branch가 있습니다/i)).toBeTruthy()
    expect(screen.queryByText(/A branch with that name already exists/i)).toBeNull()
  })
})
