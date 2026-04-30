// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectSettingsPanel } from '../components/ProjectSettingsPanel/ProjectSettingsPanel'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    projectSettingsTitle: '프로젝트 설정',
    projectSettingsDescription: '이 프로젝트의 AI 저장 메시지와 클라우드 업로드 상태를 확인합니다.',
    closeProjectSettingsLabel: '프로젝트 설정 닫기',
    aiSaveMessagesTitle: 'AI 저장 메시지',
    useAiAutoSaveMessagesLabel: 'AI 자동 저장 메시지 사용',
    aiConnectionLabel: 'AI 연결',
    aiConnectedLabel: '연결됨',
    aiConnectProviderFirstLabel: 'AI provider를 먼저 연결하세요',
    modelLabel: '모델',
    noneSelectedLabel: '선택 안 됨',
    diffConsentLabel: 'diff 동의',
    diffConsentGrantedLabel: '허용됨',
    diffConsentNotGrantedLabel: '아직 허용 안 됨',
    openConnectAiBtn: 'AI 연결 열기',
    cloudUploadTitle: '클라우드 업로드',
    statusLabel: '상태',
    privateBackupReadyLabel: 'private 백업 준비됨',
    teamUploadReadyLabel: '팀 업로드 준비됨',
    cloudBackupNotSetUpLabel: '클라우드 백업 미설정',
    defaultBranchLabel: '기본 branch',
    protectedBranchSuffix: '보호됨',
    notDetectedYetLabel: '아직 감지 안 됨',
    repositoryLabel: '저장소',
    remoteLabel: 'remote',
    branchLabel: 'branch',
    notChosenLabel: '선택 안 됨',
    setupCloudUploadBtn: '클라우드 업로드 설정',
    changeUploadTargetBtn: '업로드 대상 변경'
  })
}))

describe('ProjectSettingsPanel', () => {
  it('shows AI and cloud state together', () => {
    render(
      <ProjectSettingsPanel
        aiSettings={{
          auto_save_message_enabled: true,
          ai_diff_consent_granted: true,
          ai_diff_consent_granted_at: 1
        }}
        aiConnectionStatus="connected"
        selectedModel="gpt-4.1-mini"
        cloudTarget={{
          mode: 'backup',
          backup: {
            remoteName: 'gat-backup',
            repoOwner: 'tony',
            repoName: 'demo-backup',
            private: true
          },
          collaboration: null
        }}
        onAiChange={vi.fn()}
        onOpenAiConnection={vi.fn()}
        onOpenCloudSetup={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/AI 자동 저장 메시지 사용/i)).toBeTruthy()
    expect(screen.getByText(/private 백업 준비됨/i)).toBeTruthy()
  })
})
