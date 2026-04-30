import { StagedDiffContext } from '../git/types'

export type AiProviderName = 'openai' | 'anthropic'
export type AiOutputLanguage = 'en' | 'ko'

export interface ConnectProviderInput {
  provider: AiProviderName
  apiKey: string
}

export interface GenerateAutoSaveMessageInput {
  provider: AiProviderName
  model: string
  apiKey: string
  outputLanguage?: AiOutputLanguage
  diffContext: StagedDiffContext
}

export interface GenerateCommitSuggestionInput {
  provider: AiProviderName
  model: string
  apiKey: string
  outputLanguage?: AiOutputLanguage
  diff: string
}

export interface AiProviderValidateInput {
  apiKey: string
}

export interface AiProviderValidateResult {
  ok: boolean
  availableModels: string[]
  selectedModel?: string
}

export interface AiProviderGenerateInput {
  apiKey: string
  model: string
  prompt: string
}

export interface AiProviderStructuredInput {
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
}

export interface AiProviderAdapter {
  validateKey(input: AiProviderValidateInput): Promise<AiProviderValidateResult>
  generateMessage(input: AiProviderGenerateInput): Promise<string | null>
  generateStructured?<T>(input: AiProviderStructuredInput): Promise<T>
}
