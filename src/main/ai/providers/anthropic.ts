import { AiProviderAdapter, AiProviderGenerateInput, AiProviderValidateInput, AiProviderValidateResult } from '../types'

const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models'
const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'

interface AnthropicModelsResponse {
  data?: Array<{ id?: string }>
}

interface AnthropicMessagesResponse {
  content?: Array<{
    type?: string
    text?: string
  }>
}

function getHeaders(apiKey: string): HeadersInit {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_API_VERSION
  }
}

export function createAnthropicProvider(): AiProviderAdapter {
  return {
    async validateKey(input: AiProviderValidateInput): Promise<AiProviderValidateResult> {
      const response = await fetch(ANTHROPIC_MODELS_URL, {
        headers: getHeaders(input.apiKey)
      })

      if (!response.ok) {
        throw new Error('Failed to validate Anthropic connection.')
      }

      const payload = (await response.json()) as AnthropicModelsResponse
      const availableModels =
        payload.data
          ?.map((entry) => entry.id?.trim())
          .filter((value): value is string => Boolean(value)) ?? []

      if (availableModels.length === 0) {
        throw new Error('Anthropic did not return any available models.')
      }

      return {
        ok: true,
        availableModels,
        selectedModel: availableModels[0]
      }
    },

    async generateMessage(input: AiProviderGenerateInput): Promise<string | null> {
      const response = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: 'POST',
        headers: getHeaders(input.apiKey),
        body: JSON.stringify({
          model: input.model,
          max_tokens: 120,
          messages: [
            {
              role: 'user',
              content: input.prompt
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate an Anthropic save message.')
      }

      const payload = (await response.json()) as AnthropicMessagesResponse
      return payload.content?.find((entry) => entry.type === 'text')?.text?.trim() ?? null
    }
  }
}
