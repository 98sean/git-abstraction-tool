import { join } from 'node:path'
import Store from 'electron-store'

export type AiProvider = 'openai' | 'anthropic'
export type AiConnectionStatus = 'connected' | 'invalid' | 'disconnected'

export interface AiConnectionState {
  provider: AiProvider | null
  selected_model: string | null
  available_models: string[]
  last_verified_at: number | null
  connection_status: AiConnectionStatus
}

const defaultAiConnectionState: AiConnectionState = {
  provider: null,
  selected_model: null,
  available_models: [],
  last_verified_at: null,
  connection_status: 'disconnected'
}

const storeCwd = process.env.VITEST ? join(process.cwd(), '.vitest', 'electron-store') : undefined

const store = new Store<AiConnectionState>({
  name: 'aiConnection',
  defaults: defaultAiConnectionState,
  ...(storeCwd ? { cwd: storeCwd } : {})
})

export function getAiConnectionState(): AiConnectionState {
  return {
    ...defaultAiConnectionState,
    ...store.store
  }
}

export function setAiConnectionState(state: AiConnectionState): void {
  store.set(state)
}

export function clearAiConnectionState(): void {
  store.clear()
}
