export interface BranchNameValidation {
  ok: boolean
  message: string | null
}

export function validateBranchName(name: string): BranchNameValidation {
  const trimmed = name.trim()

  if (!trimmed) return { ok: false, message: 'Choose a branch name.' }
  if (/\s/.test(trimmed)) return { ok: false, message: 'Branch names cannot contain spaces.' }
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    return { ok: false, message: 'Branch names cannot start or end with "/".' }
  }
  if (trimmed.includes('..')) {
    return { ok: false, message: 'Branch names cannot contain "..".' }
  }
  if (/[\x00-\x20~^:?*[\\]/.test(trimmed)) {
    return { ok: false, message: 'Branch name contains unsupported characters.' }
  }

  return { ok: true, message: null }
}
