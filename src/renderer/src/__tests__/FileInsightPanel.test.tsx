// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FileInsightPanel } from '../components/FileInsightPanel/FileInsightPanel'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    fileInsightTitle: '파일 설명',
    fileInsightConnectAiHint: '파일 설명을 사용하려면 AI를 연결하세요.',
    fileInsightSelectFileHint: '파일을 클릭하면 역할과 관련 파일을 볼 수 있습니다.',
    fileInsightAnalyzingBtn: '분석 중...',
    fileInsightRefreshBtn: '새로고침',
    fileInsightAnalyzingText: '파일 역할과 관련 파일 분석 중...',
    fileInsightSummaryTitle: '요약',
    fileInsightFunctionalityTitle: '이 파일이 하는 일',
    fileInsightRelatedFilesTitle: '관련 파일',
    fileInsightNoRelatedFiles: '관련 파일을 찾지 못했습니다.'
  })
}))

describe('FileInsightPanel', () => {
  it('shows provider-neutral copy when file insight is unavailable', () => {
    render(
      <FileInsightPanel
        selectedPath={null}
        insight={null}
        loading={false}
        error={null}
        enabled={false}
        onRetry={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    )

    expect(screen.getByText(/파일 설명을 사용하려면 AI를 연결하세요/i)).toBeTruthy()
  })
})
