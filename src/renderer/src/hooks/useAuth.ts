import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'
import { GithubTokenValidationResult } from '../types'
import { useToast } from './useToast'

export interface DeviceFlowState {
  user_code: string
  verification_uri: string
  expires_in: number
}

export function useAuth(): {
  tokenExists: boolean | null
  deviceFlow: DeviceFlowState | null
  saveToken: (token: string) => Promise<void>
  clearToken: () => Promise<void>
  startDeviceFlow: () => Promise<void>
  cancelDeviceFlow: () => Promise<void>
} {
  const [tokenExists, setTokenExists] = useState<boolean | null>(null)
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    invokeDb<boolean>('auth:token:exists').then(setTokenExists)
  }, [])

  // Listen for device flow results pushed from main process
  useEffect(() => {
    const onSuccess = (): void => {
      setTokenExists(true)
      setDeviceFlow(null)
      addToast('GitHub connected successfully', 'success')
    }

    const onError = (_: Electron.IpcRendererEvent, message: string): void => {
      setDeviceFlow(null)
      addToast(message ?? 'GitHub login failed. Please try again.', 'error')
    }

    window.electron.ipcRenderer.on('auth:github:device:success', onSuccess)
    window.electron.ipcRenderer.on('auth:github:device:error', onError)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('auth:github:device:success')
      window.electron.ipcRenderer.removeAllListeners('auth:github:device:error')
    }
  }, [addToast])

  const saveToken = useCallback(
    async (token: string): Promise<void> => {
      try {
        const result = await invokeDb<GithubTokenValidationResult>('auth:token:set', token)
        setTokenExists(true)
        addToast(
          result.accountLogin
            ? `GitHub connected as ${result.accountLogin}`
            : 'GitHub connected successfully',
          'success'
        )
      } catch (error) {
        addToast(
          error instanceof Error
            ? error.message
            : 'Could not save credentials securely. Please try again.',
          'error'
        )
      }
    },
    [addToast]
  )

  const clearToken = useCallback(async (): Promise<void> => {
    await invokeDb('auth:token:clear')
    setTokenExists(false)
    addToast('GitHub disconnected', 'info')
  }, [addToast])

  const startDeviceFlow = useCallback(async (): Promise<void> => {
    try {
      const result = await invokeDb<DeviceFlowState>('auth:github:device:start')
      setDeviceFlow(result)
    } catch {
      addToast('Could not start GitHub login. Check your internet connection.', 'error')
    }
  }, [addToast])

  const cancelDeviceFlow = useCallback(async (): Promise<void> => {
    await invokeDb('auth:github:device:cancel')
    setDeviceFlow(null)
  }, [])

  return { tokenExists, deviceFlow, saveToken, clearToken, startDeviceFlow, cancelDeviceFlow }
}
