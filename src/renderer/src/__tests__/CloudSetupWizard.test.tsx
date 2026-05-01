// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CloudSetupWizard } from '../components/CloudSetupWizard/CloudSetupWizard'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    cloudSetupEyebrow: '클라우드 업로드',
    cloudSetupTitle: '이 프로젝트를 어떻게 업로드할까요?',
    cloudSetupSafeTitle: '안전한 업로드 방식 선택',
    closeCloudSetupLabel: '클라우드 설정 닫기',
    backupIntentTitle: '내 GitHub에 백업',
    backupIntentCopy: '앱이 관리하는 private 백업 저장소를 새로 만듭니다.',
    teamIntentTitle: '팀 repository에 작업 올리기',
    teamIntentCopy: '팀에 바로 반영하지 않고 리뷰용 작업 branch를 먼저 만듭니다.',
    backupSetupCopy: '새 private GitHub repository를 만들고 이 프로젝트의 백업 대상으로 사용합니다.',
    cancelBtn: '취소',
    creatingBackupBtn: '백업 생성 중...',
    createPrivateBackupBtn: 'private 백업 만들기',
    teamSetupCopy: '업로드 전에 어떤 remote와 branch 흐름을 사용할지 명확히 선택합니다.',
    teamRemoteLabel: '팀 remote',
    noRemotesFoundLabel: '감지된 remote 없음',
    createWorkBranchTitle: '리뷰용 작업 branch 만들기',
    createWorkBranchCopy: '추천. 새 branch를 push한 뒤 GitHub에서 리뷰를 요청합니다.',
    existingBranchTitle: '기존 non-default branch 사용',
    existingBranchCopy: '팀 업로드용으로 이미 준비된 branch를 선택합니다.',
    showRiskyOptionBtn: '위험 옵션 보기',
    defaultBranchUploadTitle: 'default branch에 직접 업로드',
    defaultBranchUploadCopy: '리뷰 없이 팀 main branch가 바뀔 수 있습니다.',
    workBranchNameLabel: '작업 branch 이름',
    uploadBranchNameLabel: '업로드할 branch 이름',
    workBranchPlaceholder: 'gat/my-update',
    uploadBranchPlaceholder: 'main',
    workBranchHelpText: '예: gat/login-fix. 리뷰 전까지 main에는 반영되지 않습니다.',
    branchAlreadyExistsMsg: (name: string) => `"${name}" branch가 이미 있습니다. 다른 이름을 쓰거나 기존 branch 모드를 선택하세요.`,
    savingTargetBtn: '대상 저장 중...',
    saveTeamTargetBtn: '팀 업로드 대상 저장'
  })
}))

describe('CloudSetupWizard', () => {
  afterEach(() => {
    cleanup()
  })

  it('lets the user choose backup vs team upload', () => {
    const onChoose = vi.fn()

    render(<CloudSetupWizard onChooseIntent={onChoose} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /내 GitHub에 백업/i }))
    expect(onChoose).toHaveBeenCalledWith('backup')
  })

  it('blocks team upload setup when the branch name contains spaces', () => {
    const onContinue = vi.fn()

    render(
      <CloudSetupWizard
        intent="collaboration"
        remotes={[{ name: 'origin', fetch: 'https://github.com/acme/demo.git', push: 'https://github.com/acme/demo.git' }]}
        selectedRemoteName="origin"
        selectedBranch="test and fix"
        onChooseIntent={vi.fn()}
        onClose={vi.fn()}
        onContinueCollaboration={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /팀 업로드 대상 저장/i }))

    expect(screen.getByText(/Branch names cannot contain spaces/i)).toBeTruthy()
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('explains the recommended team branch flow in Korean', () => {
    render(
      <CloudSetupWizard
        intent="collaboration"
        remotes={[{ name: 'origin', fetch: 'https://github.com/acme/demo.git', push: 'https://github.com/acme/demo.git' }]}
        selectedRemoteName="origin"
        selectedBranch="gat/demo-update"
        onChooseIntent={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/리뷰용 작업 branch 만들기/i)).toBeTruthy()
    expect(screen.getByText(/GitHub에서 리뷰를 요청/i)).toBeTruthy()
    expect(screen.getByText(/리뷰 전까지 main에는 반영되지 않습니다/i)).toBeTruthy()
  })

  it('blocks new team branch setup when the branch already exists locally', () => {
    const onContinue = vi.fn()

    render(
      <CloudSetupWizard
        intent="collaboration"
        remotes={[{ name: 'origin', fetch: 'https://github.com/acme/demo.git', push: 'https://github.com/acme/demo.git' }]}
        selectedRemoteName="origin"
        selectedBranch="gat/demo-update"
        existingBranchNames={['main', 'gat/demo-update']}
        onChooseIntent={vi.fn()}
        onClose={vi.fn()}
        onContinueCollaboration={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /팀 업로드 대상 저장/i }))

    expect(screen.getByText(/이미 있습니다/i)).toBeTruthy()
    expect(onContinue).not.toHaveBeenCalled()
  })
})
