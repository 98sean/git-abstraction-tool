import { StagedDiffContext } from '../git/types'
import { AiOutputLanguage } from './types'

const MAX_DIFF_LENGTH = 12000
const OUTPUT_LANGUAGE_LABEL: Record<AiOutputLanguage, string> = {
  en: 'English',
  ko: 'Korean'
}

export function buildAutoSavePrompt(
  input: StagedDiffContext,
  outputLanguage: AiOutputLanguage = 'en'
): string {
  const fileSummary =
    input.files.length > 0
      ? input.files.map((file) => `- ${file.path} (${file.status})`).join('\n')
      : 'No staged files were detected.'

  const diffSection = input.diff.slice(0, MAX_DIFF_LENGTH).trim()

  return [
    'Write one plain-language save message for a desktop Git app.',
    'Rules:',
    '- Return exactly one sentence.',
    `- Write the message in ${OUTPUT_LANGUAGE_LABEL[outputLanguage]}.`,
    '- Describe only the staged work in simple human language.',
    '- Do not use Git jargon or conventional commit prefixes.',
    '- Keep it under 90 characters when possible.',
    '',
    'Staged files:',
    fileSummary,
    '',
    'Staged diff:',
    diffSection
  ].join('\n')
}
