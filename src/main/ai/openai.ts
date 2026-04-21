import { createHash } from 'node:crypto'

export type CommitChangeKind =
  | 'feature'
  | 'fix'
  | 'content'
  | 'style'
  | 'config'
  | 'refactor'
  | 'chore'
  | 'mixed'

export interface CommitSuggestion {
  message: string
  summary: string
  change_kind: CommitChangeKind
  user_visible: boolean
  areas: string[]
  keywords: string[]
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

const VALID_CHANGE_KINDS: CommitChangeKind[] = [
  'feature',
  'fix',
  'content',
  'style',
  'config',
  'refactor',
  'chore',
  'mixed'
]

const SYSTEM_PROMPT = `You are an assistant embedded inside a desktop app that helps non-technical users (vibe coders, designers, writers, students) save their work to Git without knowing Git. Your job is to read a staged git diff and describe what actually changed, for two audiences:

1. The user, who will see ONE short plain-language sentence used as the commit message.
2. The app itself, which will store a richer paragraph internally and later use it to (a) help the user find a past point in history from a natural-language query like "before I removed the red button", and (b) generate a weekly changelog. The user never sees this paragraph directly, but it must be truthful, specific, and written as prose.

Hard rules:
- Read the actual diff content. Do not just list filenames. Describe what behavior, UI, copy, styling, data, configuration, or logic changed.
- Use plain language. No git jargon (no "refactor", "staged", "hunk", "commit", "HEAD", "rebase"). No diff syntax, no line numbers, no "+/-".
- Never invent changes that are not in the diff. If the diff is trivial (whitespace, formatting, import reordering only), say so honestly.
- Use the user's own words when they appear in added strings, labels, comments, or UI copy. Quote short literal strings in double quotes when useful (e.g. the button now says "Sign up for free").
- Prefer user-facing vocabulary: "the homepage", "the sign-up button", "the contact form", "the dark-mode toggle". Only fall back to file or component names when no user-facing concept exists.
- If multiple unrelated changes are present, describe the 2-3 most significant ones and briefly acknowledge the rest.
- Output must be STRICT JSON matching the schema below. No markdown, no code fences, no trailing commentary.

Output schema (all fields required):
{
  "message": "...",
  "summary": "...",
  "change_kind": "feature | fix | content | style | config | refactor | chore | mixed",
  "user_visible": true | false,
  "areas": ["..."],
  "keywords": ["..."]
}

Field contract:

- message
  - One sentence, <= 72 characters when possible, never more than 100.
  - Past tense, plain English (or the user's language if the diff comments are in that language).
  - Must stand alone as a commit message a non-developer would recognize.
  - No trailing period is fine either way; do not add emoji.
  - Examples of good messages:
    * Changed the homepage background to navy and fixed a typo in the contact form
    * Added a Sign Up button and wired it to the new pricing page
    * Reworded the error message shown when login fails
  - Examples of bad messages:
    * feat: update Home.tsx and styles.css
    * Refactored several files
    * Various small changes

- summary
  - One paragraph, 2-5 sentences, 40-120 words.
  - Written as connected prose, not bullets.
  - Describe WHAT the user would notice if they ran the app, plus WHY it is a meaningful change when inferable.
  - Mention the concrete surface (page / screen / form / button / section / color / copy / setting) that changed.
  - It is OK to reference a component or page name if it matches how the user would think of it (e.g. "the Pricing page", "the sign-up form").
  - Avoid raw file paths unless no user-facing name exists; then use a short natural phrase ("the contact-form component").
  - This paragraph will later be searched by another AI when the user says things like "restore to before I removed the red button" or "what did I do last Tuesday". Write it so those queries can match it.

- change_kind
  - Single best label from the enum. Use "mixed" only when at least two of the others apply roughly equally.
  - "content" = copy/text/image/asset changes. "style" = visual/CSS-only. "config" = settings, env, build, dependencies. "chore" = repo hygiene with no user effect.

- user_visible
  - true if an end user running the app would notice the change. false for pure refactors, formatting, internal renames, dependency bumps with no behavior change, etc.

- areas
  - 1-5 short natural-language labels for the parts of the product touched. Lowercase, no file extensions.
  - Good: ["homepage", "contact form", "footer"], ["sign-up flow"], ["dark mode"], ["dependency update"].
  - Bad: ["src/pages/home.tsx"], ["Home Component Render Method"].

- keywords
  - 3-8 short search-friendly terms (single words or 2-word phrases, lowercase) that a user might type when asking "take me back to when I ...".
  - Include any literal UI text that changed (e.g. "sign up", "free trial"), and any distinctive colors, components, or nouns from the diff.
  - Do not include generic git words or generic tech words ("update", "code", "fix", "change", "file").

If the diff is empty or contains only whitespace/formatting changes, still return valid JSON with message like "Tidied up formatting with no behavior changes", a matching summary, change_kind="chore", user_visible=false, and a minimal areas/keywords list.`

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : fallback
}

function normalizeStringList(value: unknown, min: number, max: number): string[] {
  if (!Array.isArray(value)) return []
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim().toLowerCase() : ''))
    .filter((item) => item.length > 0)
  const deduped = Array.from(new Set(cleaned))
  if (deduped.length > max) return deduped.slice(0, max)
  if (deduped.length < min) return deduped
  return deduped
}

function normalizeChangeKind(value: unknown): CommitChangeKind {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase() as CommitChangeKind
    if (VALID_CHANGE_KINDS.includes(normalized)) return normalized
  }
  return 'mixed'
}

function normalizeUserVisible(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return true
}

interface ParsedSuggestion {
  message: string
  summary: string
  change_kind: CommitChangeKind
  user_visible: boolean
  areas: string[]
  keywords: string[]
}

function parseSuggestion(raw: string): ParsedSuggestion {
  const parsed = JSON.parse(raw) as {
    message?: unknown
    summary?: unknown
    change_kind?: unknown
    user_visible?: unknown
    areas?: unknown
    keywords?: unknown
  }
  return {
    message: normalizeText(parsed.message, 'Update project files'),
    summary: normalizeText(
      parsed.summary,
      'Updated project files and recorded the main changes for future summaries.'
    ),
    change_kind: normalizeChangeKind(parsed.change_kind),
    user_visible: normalizeUserVisible(parsed.user_visible),
    areas: normalizeStringList(parsed.areas, 1, 5),
    keywords: normalizeStringList(parsed.keywords, 3, 8)
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
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content:
            'Here is the staged git diff to summarize. Follow the system rules and output only the JSON object.\n\n' +
            '---BEGIN DIFF---\n' +
            truncatedDiff +
            '\n---END DIFF---'
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
