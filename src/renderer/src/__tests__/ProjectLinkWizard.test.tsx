// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectLinkWizard } from '../components/ProjectLinkWizard/ProjectLinkWizard'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    linkProjectEyebrow: '프로젝트 연결',
    linkChooseTitle: '프로젝트 폴더 선택',
    linkPrepareTitle: '변경 기록 켜기',
    linkWarningsTitle: '폴더 경고 확인',
    linkReviewTitle: '연결 마무리',
    linkCloseLabel: '연결 마법사 닫기',
    linkSelectedFolderLabel: '선택한 폴더',
    linkChooseCopy: '연결하기 전에 이 폴더가 로컬 저장 기록을 사용할 준비가 됐는지 확인합니다.',
    linkCheckingFolderBtn: '폴더 확인 중...',
    linkChooseFolderBtn: '폴더 선택',
    linkPrepareCopy:
      '이 폴더는 아직 Git을 사용하지 않습니다. 변경 기록을 켜도 저장은 로컬에 남고 GitHub에는 업로드되지 않습니다.',
    cancelBtn: '취소',
    linkApproveInitBtn: '켜고 계속하기',
    linkWarningsCopy: '저장 기록을 시작하기 전에 제외하는 편이 좋은 파일을 찾았습니다.',
    linkExcludeLabel: '제외',
    linkRecommendedExcludesLabel: '추천 제외 항목',
    linkWarningReason: () => '생성된 폴더는 보통 저장 기록에 포함하지 않는 편이 좋습니다.',
    linkFinishBtn: '연결 완료',
    linkReviewCopy: '이 폴더는 준비됐습니다. 등록 후 바로 로컬 파일 감시를 시작합니다.',
    linkDetectedRemotesLabel: '감지된 remote',
    linkLinkingBtn: '프로젝트 연결 중...',
    noneSelectedLabel: '선택 안 됨'
  })
}))

describe('ProjectLinkWizard', () => {
  it('shows init approval for non-git folders', () => {
    render(
      <ProjectLinkWizard
        inspection={{
          isGitRepo: false,
          canInitialize: true,
          remotes: [],
          warnings: [],
          recommendedIgnoreEntries: []
        }}
        onApproveInit={vi.fn()}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />
    )

    expect(screen.getByText(/변경 기록 켜기/i)).toBeTruthy()
    expect(screen.getByText(/GitHub에는 업로드되지 않습니다/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /켜고 계속하기/i }))
  })

  it('shows folder warnings in Korean', () => {
    render(
      <ProjectLinkWizard
        inspection={{
          isGitRepo: true,
          canInitialize: false,
          remotes: [],
          warnings: [
            {
              kind: 'generated',
              path: 'node_modules',
              reason: 'Generated folders usually should not be tracked.'
            }
          ],
          recommendedIgnoreEntries: ['node_modules']
        }}
        selectedIgnoreEntries={['node_modules']}
        onToggleIgnoreEntry={vi.fn()}
        onApproveInit={vi.fn()}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />
    )

    expect(screen.getByText(/폴더 경고 확인/i)).toBeTruthy()
    expect(screen.getByText(/생성된 폴더는 보통 저장 기록에 포함하지 않는 편/i)).toBeTruthy()
    expect((screen.getByRole('checkbox', { name: /제외/i }) as HTMLInputElement).checked).toBe(true)
  })
})
