import Store from 'electron-store'

interface CacheEntry {
  status: unknown
  cached_at: number
}

interface StatusCacheSchema {
  [project_id: string]: CacheEntry
}

const store = new Store<StatusCacheSchema>({
  name: 'statusCache',
  defaults: {}
})

export function getCachedStatus(project_id: string): unknown | null {
  const entry = store.get(project_id as never) as CacheEntry | undefined
  return entry?.status ?? null
}

export function setCachedStatus(project_id: string, status: unknown): void {
  store.set(project_id as never, { status, cached_at: Date.now() } as never)
}

export function invalidateCache(project_id: string): void {
  store.delete(project_id as never)
}

export function clearAllCache(): void {
  store.clear()
}
