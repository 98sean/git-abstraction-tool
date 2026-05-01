import { AiOutputLanguage } from './types'

export interface ConflictHint {
  hint: string
  recommendation: 'ours' | 'theirs' | 'either'
}

const SYSTEM_PROMPT = `You are a helpful assistant embedded in a version control app for non-technical users. You are shown two versions of a file that have conflicting changes. Briefly explain the key difference in one plain sentence, then recommend which to keep.

Output STRICT JSON only, no markdown:
{
  "hint": "one sentence, plain language, under 100 characters",
  "recommendation": "ours" | "theirs" | "either"
}

- hint: describe the main practical difference (what behavior, content, or UI changes). No git jargon, no code syntax.
- recommendation: "ours" = current branch version is clearly preferable; "theirs" = incoming version is clearly preferable; "either" = both are equivalent or it depends on preference.`

const OUTPUT_LANGUAGE_SUFFIX: Record<AiOutputLanguage, string> = {
  en: 'Write the hint in English.',
  ko: '힌트를 한국어로 작성하세요.'
}

export function buildConflictAnalysisPrompts(
  filePath: string,
  ours: string,
  theirs: string,
  outputLanguage: AiOutputLanguage = 'en'
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: [SYSTEM_PROMPT, '', OUTPUT_LANGUAGE_SUFFIX[outputLanguage]].join('\n'),
    userPrompt: [
      `File: ${filePath}`,
      '',
      '--- YOUR VERSION (current branch) ---',
      ours.slice(0, 6000) || '(empty)',
      '',
      '--- INCOMING VERSION ---',
      theirs.slice(0, 6000) || '(empty)',
      '',
      'Output only the JSON object.'
    ].join('\n')
  }
}

export function finalizeConflictHint(payload: unknown): ConflictHint {
  if (typeof payload !== 'object' || payload === null) {
    return { hint: 'Could not analyze the difference.', recommendation: 'either' }
  }

  const p = payload as Record<string, unknown>
  const hint =
    typeof p.hint === 'string' && p.hint.trim().length > 0
      ? p.hint.trim()
      : 'Could not analyze the difference.'

  const validRecs = ['ours', 'theirs', 'either'] as const
  const recommendation = validRecs.includes(p.recommendation as (typeof validRecs)[number])
    ? (p.recommendation as 'ours' | 'theirs' | 'either')
    : 'either'

  return { hint, recommendation }
}
