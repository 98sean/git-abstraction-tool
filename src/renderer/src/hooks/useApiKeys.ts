import { useState, useCallback } from 'react'

const STORAGE_KEY_OPENAI = 'gat_apikey_openai'
const STORAGE_KEY_ANTHROPIC = 'gat_apikey_anthropic'

export interface ApiKeys {
  openai: string | null
  anthropic: string | null
}

export function useApiKeys(): {
  keys: ApiKeys
  setOpenAIKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  clearOpenAIKey: () => void
  clearAnthropicKey: () => void
} {
  const [keys, setKeys] = useState<ApiKeys>(() => ({
    openai: localStorage.getItem(STORAGE_KEY_OPENAI),
    anthropic: localStorage.getItem(STORAGE_KEY_ANTHROPIC)
  }))

  const setOpenAIKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY_OPENAI, key)
    setKeys((prev) => ({ ...prev, openai: key }))
  }, [])

  const setAnthropicKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY_ANTHROPIC, key)
    setKeys((prev) => ({ ...prev, anthropic: key }))
  }, [])

  const clearOpenAIKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_OPENAI)
    setKeys((prev) => ({ ...prev, openai: null }))
  }, [])

  const clearAnthropicKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ANTHROPIC)
    setKeys((prev) => ({ ...prev, anthropic: null }))
  }, [])

  return { keys, setOpenAIKey, setAnthropicKey, clearOpenAIKey, clearAnthropicKey }
}
