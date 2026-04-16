import { AiProviderAdapter, AiProviderGenerateInput, AiProviderValidateInput, AiProviderValidateResult } from '../types'

const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models'
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_DEFAULT_MODEL = 'gpt-4.1-mini'

interface OpenAiModelsResponse {
  data?: Array<{ id?: string }>
}

interface OpenAiResponsesResponse {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

function getHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}

function pickSelectedModel(models: string[]): string {
  return models.includes(OPENAI_DEFAULT_MODEL) ? OPENAI_DEFAULT_MODEL : models[0]
}

function extractOutputText(payload: OpenAiResponsesResponse): string | null {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim()
  }

  return (
    payload.output
      ?.flatMap((entry) => entry.content ?? [])
      .filter((entry) => entry.type === 'output_text' || entry.type === 'text')
      .map((entry) => entry.text?.trim())
      .find((value): value is string => Boolean(value)) ?? null
  )
}

export function createOpenAiProvider(): AiProviderAdapter {
  return {
    async validateKey(input: AiProviderValidateInput): Promise<AiProviderValidateResult> {
      const response = await fetch(OPENAI_MODELS_URL, {
        headers: getHeaders(input.apiKey)
      })

      if (!response.ok) {
        throw new Error('Failed to validate OpenAI connection.')
      }

      const payload = (await response.json()) as OpenAiModelsResponse
      const availableModels =
        payload.data
          ?.map((entry) => entry.id?.trim())
          .filter((value): value is string => Boolean(value))
          .sort() ?? []

      if (availableModels.length === 0) {
        throw new Error('OpenAI did not return any available models.')
      }

      return {
        ok: true,
        availableModels,
        selectedModel: pickSelectedModel(availableModels)
      }
    },

    async generateMessage(input: AiProviderGenerateInput): Promise<string | null> {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: getHeaders(input.apiKey),
        body: JSON.stringify({
          model: input.model,
          instructions: 'You write one concise plain-language save message.',
          input: input.prompt
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate an OpenAI save message.')
      }

      const payload = (await response.json()) as OpenAiResponsesResponse
      return extractOutputText(payload)
    }
  }
}
