// In-memory cache only — no disk persistence.
// Status data is always fresh on app restart.

interface CacheEntry {
  status: unknown
}

const cache = new Map<string, CacheEntry>()

export function getCachedStatus(project_id: string): unknown | null {
  return cache.get(project_id)?.status ?? null
}

export function setCachedStatus(project_id: string, status: unknown): void {
  cache.set(project_id, { status })
}

export function invalidateCache(project_id: string): void {
  cache.delete(project_id)
}

export function clearAllCache(): void {
  cache.clear()
}
