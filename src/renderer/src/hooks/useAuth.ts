import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'
import { useToast } from './useToast'

export function useAuth(): {
  tokenExists: boolean | null  // null = still loading
  saveToken: (token: string) => Promise<void>
  clearToken: () => Promise<void>
} {
  const [tokenExists, setTokenExists] = useState<boolean | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    invokeDb<boolean>('auth:token:exists').then(setTokenExists)
  }, [])

  const saveToken = useCallback(
    async (token: string): Promise<void> => {
      try {
        await invokeDb('auth:token:set', token)
        setTokenExists(true)
        addToast('GitHub connected successfully', 'success')
      } catch {
        addToast('Could not save credentials securely. Please try again.', 'error')
      }
    },
    [addToast]
  )

  const clearToken = useCallback(async (): Promise<void> => {
    await invokeDb('auth:token:clear')
    setTokenExists(false)
    addToast('GitHub disconnected', 'info')
  }, [addToast])

  return { tokenExists, saveToken, clearToken }
}
