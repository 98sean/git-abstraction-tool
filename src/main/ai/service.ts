import { AiConnectionState } from '../db/aiConnection'
import { buildAutoSavePrompt } from './buildAutoSavePrompt'
import {
  buildCommitSuggestionUserPrompt,
  buildCommitSuggestionSystemPrompt,
  CommitSuggestion,
  finalizeCommitSuggestion
} from './commitSuggestion'
import { createAnthropicProvider } from './providers/anthropic'
import { createOpenAiProvider } from './providers/openai'
import {
  AiProviderAdapter,
  AiProviderName,
  AiProviderStructuredInput,
  ConnectProviderInput,
  GenerateCommitSuggestionInput,
  GenerateAutoSaveMessageInput
} from './types'

type ProviderMap = Record<AiProviderName, AiProviderAdapter>

const AUTO_SAVE_TIMEOUT_MS = 5000
const MIN_MESSAGE_LENGTH = 12

function pickProvider(providers: ProviderMap, provider: AiProviderName): AiProviderAdapter {
  return providers[provider]
}

function timeoutAfter(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms)
  })
}

function normalizeGeneratedMessage(message: string | null): string | null {
  const normalized = message?.trim().replace(/\s+/g, ' ') ?? ''

  if (normalized.length < MIN_MESSAGE_LENGTH) {
    return null
  }

  if (/^(feat|fix|refactor|chore):/i.test(normalized)) {
    return null
  }

  return normalized
}

export function createAiService(overrides: Partial<ProviderMap> = {}) {
  const providers: ProviderMap = {
    openai: createOpenAiProvider(),
    anthropic: createAnthropicProvider(),
    ...overrides
  }

  return {
    async connectProvider(input: ConnectProviderInput): Promise<AiConnectionState> {
      const provider = pickProvider(providers, input.provider)
      const result = await provider.validateKey({ apiKey: input.apiKey })
      const availableModels = result.availableModels
      const selectedModel = result.selectedModel ?? availableModels[0] ?? null

      if (!result.ok || availableModels.length === 0 || !selectedModel) {
        throw new Error('The AI provider did not return any usable models.')
      }

      return {
        provider: input.provider,
        selected_model: selectedModel,
        available_models: availableModels,
        last_verified_at: Date.now(),
        connection_status: 'connected'
      }
    },

    async generateAutoSaveMessage(input: GenerateAutoSaveMessageInput): Promise<string | null> {
      if (!input.diffContext.diff.trim()) {
        return null
      }

      const provider = pickProvider(providers, input.provider)
      const prompt = buildAutoSavePrompt(input.diffContext, input.outputLanguage ?? 'en')

      const message = await Promise.race([
        provider.generateMessage({
          apiKey: input.apiKey,
          model: input.model,
          prompt
        }),
        timeoutAfter(AUTO_SAVE_TIMEOUT_MS)
      ])

      return normalizeGeneratedMessage(message)
    },

    async generateCommitSuggestion(input: GenerateCommitSuggestionInput): Promise<CommitSuggestion> {
      if (!input.diff.trim()) {
        throw new Error('There are no staged changes to summarize.')
      }

      const provider = pickProvider(providers, input.provider)

      if (typeof provider.generateStructured !== 'function') {
        throw new Error('The current AI connection does not support AI suggestions.')
      }

      const payload = await provider.generateStructured({
        apiKey: input.apiKey,
        model: input.model,
        systemPrompt: buildCommitSuggestionSystemPrompt(input.outputLanguage ?? 'en'),
        userPrompt: buildCommitSuggestionUserPrompt(input.diff)
      })

      return finalizeCommitSuggestion(payload, input.model, input.diff)
    },

    async generateStructured<T>(
      input: AiProviderStructuredInput & { provider: AiProviderName }
    ): Promise<T> {
      const provider = pickProvider(providers, input.provider)

      if (typeof provider.generateStructured !== 'function') {
        throw new Error('The current AI connection does not support this tool.')
      }

      return provider.generateStructured<T>(input)
    },

    supportsManualTools(provider: AiProviderName): boolean {
      return typeof providers[provider].generateStructured === 'function'
    }
  }
}
