import { safeStorage } from 'electron'
import Store from 'electron-store'

interface CredentialsSchema {
  github_token?: string // base64-encoded safeStorage-encrypted bytes
  openai_key?: string // base64-encoded safeStorage-encrypted bytes
  anthropic_key?: string // base64-encoded safeStorage-encrypted bytes
}

const store = new Store<CredentialsSchema>({
  name: 'credentials',
  defaults: {}
})

export function setGithubToken(token: string): void {
  ensureEncryptionAvailable()
  const encrypted = safeStorage.encryptString(token)
  store.set('github_token', encrypted.toString('base64'))
}

function ensureEncryptionAvailable(): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this system. ' +
        'On Linux, ensure a keyring service (GNOME Keyring or KWallet) is running.'
    )
  }
}

function setEncryptedValue(key: keyof CredentialsSchema, value: string): void {
  ensureEncryptionAvailable()
  const encrypted = safeStorage.encryptString(value)
  store.set(key, encrypted.toString('base64'))
}

function getDecryptedValue(key: keyof CredentialsSchema): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null
  const stored = store.get(key)
  if (!stored) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  } catch {
    // Decryption failed (e.g. key rotated) — clear and return null
    store.delete(key)
    return null
  }
}

export function getGithubToken(): string | null {
  return getDecryptedValue('github_token')
}

export function clearGithubToken(): void {
  store.delete('github_token')
}

export function hasGithubToken(): boolean {
  return !!store.get('github_token')
}

export function setOpenAIKey(key: string): void {
  setEncryptedValue('openai_key', key)
}

export function getOpenAIKey(): string | null {
  return getDecryptedValue('openai_key')
}

export function clearOpenAIKey(): void {
  store.delete('openai_key')
}

export function hasOpenAIKey(): boolean {
  return !!store.get('openai_key')
}

export function setAnthropicKey(key: string): void {
  setEncryptedValue('anthropic_key', key)
}

export function getAnthropicKey(): string | null {
  return getDecryptedValue('anthropic_key')
}

export function clearAnthropicKey(): void {
  store.delete('anthropic_key')
}

export function hasAnthropicKey(): boolean {
  return !!store.get('anthropic_key')
}
