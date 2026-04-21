import { createRequire } from 'node:module'
import { join } from 'node:path'
import Store from 'electron-store'

interface CredentialsSchema {
  github_token?: string // base64-encoded safeStorage-encrypted bytes
  ai_api_key?: string // base64-encoded safeStorage-encrypted bytes
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<CredentialsSchema>({
  name: 'credentials',
  defaults: {},
  ...(storeCwd ? { cwd: storeCwd } : {})
})

const require = createRequire(import.meta.url)

interface SafeStorageLike {
  isEncryptionAvailable(): boolean
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
}

function getSafeStorage(): SafeStorageLike | null {
  try {
    const electronModule = require('electron')

    if (typeof electronModule === 'string') {
      return null
    }

    return (electronModule as { safeStorage?: SafeStorageLike }).safeStorage ?? null
  } catch {
    return null
  }
}

function encryptAndStore(key: keyof CredentialsSchema, value: string): void {
  const safeStorage = getSafeStorage()

  if (!safeStorage?.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this system. ' +
        'On Linux, ensure a keyring service (GNOME Keyring or KWallet) is running.'
    )
  }

  const encrypted = safeStorage.encryptString(value)
  store.set(key, encrypted.toString('base64'))
}

function readAndDecrypt(key: keyof CredentialsSchema): string | null {
  const safeStorage = getSafeStorage()

  if (!safeStorage?.isEncryptionAvailable()) return null
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

export function setGithubToken(token: string): void {
  encryptAndStore('github_token', token)
}

export function getGithubToken(): string | null {
  return readAndDecrypt('github_token')
}

export function clearGithubToken(): void {
  store.delete('github_token')
}

export function hasGithubToken(): boolean {
  return !!store.get('github_token')
}

export function setAiApiKey(apiKey: string): void {
  encryptAndStore('ai_api_key', apiKey)
}

export function getAiApiKey(): string | null {
  return readAndDecrypt('ai_api_key')
}

export function clearAiApiKey(): void {
  store.delete('ai_api_key')
}
