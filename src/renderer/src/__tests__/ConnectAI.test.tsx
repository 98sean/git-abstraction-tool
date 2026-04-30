// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConnectAI } from '../components/ConnectAI/ConnectAI'

vi.mock('../hooks/useTerms', () => ({
  useTerms: () => ({
    connectAiTitle: 'AI 연결',
    connectAiDescription:
      '사용자 AI provider 키로 저장 초안, 자연어 되돌리기, 파일 설명, 새 파일 검토를 사용할 수 있습니다.',
    disconnectAiBtn: '연결 해제',
    providerLabel: 'Provider',
    apiKeyLabel: 'API key',
    connectingAiBtn: '연결 중...',
    connectAiBtn: 'AI 연결',
    viewProviderDocsBtn: 'provider 문서 보기',
    modelLabel: '모델',
    connectedToProviderLabel: (provider: string) => `${provider}에 연결됨`
  })
}))

describe('ConnectAI', () => {
  it('submits provider and api key', () => {
    const onConnect = vi.fn()

    render(
      <ConnectAI
        connectionStatus={{
          provider: null,
          selected_model: null,
          available_models: [],
          last_verified_at: null,
          connection_status: 'disconnected'
        }}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
        onOpenProviderDocs={vi.fn()}
        onSelectModel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/Provider/i), { target: { value: 'openai' } })
    fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: 'sk-test' } })
    fireEvent.click(screen.getByRole('button', { name: /AI 연결/i }))

    expect(
      screen.getByText(/저장 초안, 자연어 되돌리기, 파일 설명, 새 파일 검토/i)
    ).toBeTruthy()
    expect(onConnect).toHaveBeenCalledWith('openai', 'sk-test')
  })
})
