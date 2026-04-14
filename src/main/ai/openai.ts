import { createHash } from 'node:crypto'

export interface CommitSuggestion {
  message: string
  summary: string
  fingerprint: string
  model: string
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

function normalizeText(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : fallback
}

function parseSuggestion(raw: string): { message: string; summary: string } {
  const parsed = JSON.parse(raw) as { message?: string; summary?: string }
  return {
    message: normalizeText(parsed.message ?? '', 'Update project files'),
    summary: normalizeText(
      parsed.summary ?? '',
      'Updated project files and recorded the main changes for future summaries.'
    )
  }
}

export async function generateCommitSuggestion(diff: string): Promise<CommitSuggestion> {
  const apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const model = process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini'
  const fingerprint = createHash('sha256').update(diff).digest('hex')
  const truncatedDiff = diff.slice(0, 18000)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You summarize staged git diffs for non-technical users. Return strict JSON with keys "message" and "summary". ' +
            'The "message" must be one short sentence in plain language, suitable as a save/commit message. ' +
            'The "summary" must be one concise paragraph describing the important user-facing changes. ' +
            'Do not mention line numbers, hunks, or raw patch syntax.'
        },
        {
          role: 'user',
          content: `Summarize this staged git diff:\n\n${truncatedDiff}`
        }
      ]
    })
  })

  const body = (await response.json()) as OpenAIResponse
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'OpenAI request failed.')
  }

  const content = body.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned an empty response.')
  }

  const suggestion = parseSuggestion(content)
  return {
    ...suggestion,
    fingerprint,
    model
  }
}
