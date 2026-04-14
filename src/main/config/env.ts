import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function loadLocalEnv(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    if (!key || process.env[key]) continue

    process.env[key] = stripWrappingQuotes(rawValue)
  }
}
