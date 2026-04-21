import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'

export interface ApiKeys {
  openai: boolean
  anthropic: boolean
}

type AIProvider = 'openai' | 'anthropic'

export function useApiKeys(): {
  keys: ApiKeys
  loading: boolean
  setOpenAIKey: (key: string) => Promise<void>
  setAnthropicKey: (key: string) => Promise<void>
  clearOpenAIKey: () => Promise<void>
  clearAnthropicKey: () => Promise<void>
  refresh: () => Promise<void>
} {
  const [keys, setKeys] = useState<ApiKeys>({ openai: false, anthropic: false })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (): Promise<void> => {
    const result = await invokeDb<ApiKeys>('ai:keys:status')
    setKeys(result)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const setKey = useCallback(
    async (provider: AIProvider, key: string): Promise<void> => {
      await invokeDb('ai:key:set', provider, key)
      await refresh()
    },
    [refresh]
  )

  const clearKey = useCallback(
    async (provider: AIProvider): Promise<void> => {
      await invokeDb('ai:key:clear', provider)
      await refresh()
    },
    [refresh]
  )

  return {
    keys,
    loading,
    refresh,
    setOpenAIKey: (key) => setKey('openai', key),
    setAnthropicKey: (key) => setKey('anthropic', key),
    clearOpenAIKey: () => clearKey('openai'),
    clearAnthropicKey: () => clearKey('anthropic')
  }
}
