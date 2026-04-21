import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'
import { AiConnectionState, AiProvider } from '../types'
import { useToast } from './useToast'

const disconnectedState: AiConnectionState = {
  provider: null,
  connection_status: 'disconnected',
  selected_model: null,
  available_models: [],
  last_verified_at: null
}

export function useAiConnection(): {
  connectionStatus: AiConnectionState
  connect: (provider: AiProvider, apiKey: string) => Promise<void>
  disconnect: () => Promise<void>
  setModel: (model: string) => Promise<void>
} {
  const [connectionStatus, setConnectionStatus] = useState<AiConnectionState>(disconnectedState)
  const { addToast } = useToast()

  useEffect(() => {
    invokeDb<AiConnectionState>('ai:connection:get')
      .then(setConnectionStatus)
      .catch(() => {
        addToast('Could not load AI connection status.', 'error')
      })
  }, [addToast])

  const connect = useCallback(
    async (provider: AiProvider, apiKey: string): Promise<void> => {
      try {
        const nextState = await invokeDb<AiConnectionState>('ai:connection:connect', provider, apiKey)
        setConnectionStatus(nextState)
        addToast('AI connected successfully', 'success')
      } catch (error) {
        addToast('Could not validate that AI key. Please try again.', 'error')
        throw error
      }
    },
    [addToast]
  )

  const disconnect = useCallback(async (): Promise<void> => {
    const nextState = await invokeDb<AiConnectionState>('ai:connection:disconnect')
    setConnectionStatus(nextState)
    addToast('AI disconnected', 'info')
  }, [addToast])

  const setModel = useCallback(async (model: string): Promise<void> => {
    const nextState = await invokeDb<AiConnectionState>('ai:connection:model:set', model)
    setConnectionStatus(nextState)
  }, [])

  return { connectionStatus, connect, disconnect, setModel }
}
