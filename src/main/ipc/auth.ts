import { ipcMain, shell, BrowserWindow } from 'electron'
import { clearGithubToken, hasGithubToken, setGithubToken } from '../db/credentials'

const GITHUB_CLIENT_ID = 'Ov23lihbAdUM2nvHGoip'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface TokenPollResponse {
  access_token?: string
  error?: string
  error_description?: string
}

let pollTimer: ReturnType<typeof setTimeout> | null = null

function cancelPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function notifyRenderer(channel: string, payload?: unknown): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel, payload)
  })
}

async function pollForToken(
  device_code: string,
  interval: number,
  expiresAt: number
): Promise<void> {
  if (Date.now() > expiresAt) {
    notifyRenderer('auth:github:device:error', 'Login timed out. Please try again.')
    return
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })
    const data = (await res.json()) as TokenPollResponse

    if (data.access_token) {
      cancelPolling()
      setGithubToken(data.access_token)
      notifyRenderer('auth:github:device:success')
      return
    }

    let nextInterval = interval
    if (data.error === 'slow_down') nextInterval = interval + 5

    if (data.error === 'authorization_pending' || data.error === 'slow_down') {
      pollTimer = setTimeout(
        () => pollForToken(device_code, nextInterval, expiresAt),
        nextInterval * 1000
      )
      return
    }

    // access_denied, expired_token, or unknown
    cancelPolling()
    notifyRenderer(
      'auth:github:device:error',
      data.error === 'access_denied'
        ? 'Authorization was cancelled.'
        : (data.error_description ?? 'Authorization failed. Please try again.')
    )
  } catch {
    // Network error — retry after interval
    pollTimer = setTimeout(
      () => pollForToken(device_code, interval, expiresAt),
      interval * 1000
    )
  }
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:token:set', (_event, token: string) => {
    setGithubToken(token)
  })

  ipcMain.handle('auth:token:exists', () => {
    return hasGithubToken()
  })

  ipcMain.handle('auth:token:clear', () => {
    clearGithubToken()
  })

  ipcMain.handle('auth:github:device:start', async () => {
    cancelPolling()

    const res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'repo' })
    })
    const data = (await res.json()) as DeviceCodeResponse

    shell.openExternal(data.verification_uri)

    const expiresAt = Date.now() + data.expires_in * 1000
    pollTimer = setTimeout(
      () => pollForToken(data.device_code, data.interval, expiresAt),
      data.interval * 1000
    )

    return {
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      expires_in: data.expires_in
    }
  })

  ipcMain.handle('auth:github:device:cancel', () => {
    cancelPolling()
  })
}
