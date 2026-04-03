import { safeStorage } from 'electron'
import Store from 'electron-store'

interface CredentialsSchema {
  github_token?: string // base64-encoded safeStorage-encrypted bytes
}

const store = new Store<CredentialsSchema>({
  name: 'credentials',
  defaults: {}
})

export function setGithubToken(token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this system. ' +
        'On Linux, ensure a keyring service (GNOME Keyring or KWallet) is running.'
    )
  }
  const encrypted = safeStorage.encryptString(token)
  store.set('github_token', encrypted.toString('base64'))
}

export function getGithubToken(): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null
  const stored = store.get('github_token')
  if (!stored) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  } catch {
    // Decryption failed (e.g. key rotated) — clear and return null
    store.delete('github_token')
    return null
  }
}

export function clearGithubToken(): void {
  store.delete('github_token')
}

export function hasGithubToken(): boolean {
  return !!store.get('github_token')
}
