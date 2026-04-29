import { useCallback, useEffect, useRef, useState } from 'react'
import { PullUpdatesPreview } from '../types'

type InvokeGit = <T>(channel: string, ...args: unknown[]) => Promise<T>

interface UsePullUpdatesOptions {
  activeProjectId: string | null
  enabled: boolean
  currentBranch: string | null
  invokeGit: InvokeGit
  pull: () => Promise<void>
  refreshStatus: () => Promise<void>
}

interface UsePullUpdatesResult {
  preview: PullUpdatesPreview | null
  loading: boolean
  error: string | null
  showDialog: boolean
  loadPreview: (refreshAfter?: boolean) => Promise<PullUpdatesPreview | null>
  requestPull: () => Promise<void>
  confirmPull: () => void
  close: () => void
  reset: () => void
}

function getPreviewFingerprint(preview: PullUpdatesPreview): string {
  return (
    preview.latest_remote_hash ||
    `${preview.remote_name}/${preview.branch_name}:${preview.behind_count}`
  )
}

export function usePullUpdates({
  activeProjectId,
  enabled,
  currentBranch,
  invokeGit,
  pull,
  refreshStatus
}: UsePullUpdatesOptions): UsePullUpdatesResult {
  const [preview, setPreview] = useState<PullUpdatesPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const lastShownRef = useRef<Record<string, string>>({})

  const reset = useCallback((): void => {
    setPreview(null)
    setError(null)
    setLoading(false)
    setShowDialog(false)
  }, [])

  const loadPreview = useCallback(
    async (refreshAfter = false): Promise<PullUpdatesPreview | null> => {
      if (!activeProjectId) return null

      setLoading(true)
      setError(null)

      try {
        const nextPreview = await invokeGit<PullUpdatesPreview>(
          'git:pull:preview',
          activeProjectId,
          20
        )
        setPreview(nextPreview)
        if (refreshAfter) {
          await refreshStatus()
        }
        return nextPreview
      } catch (caught) {
        const message =
          (caught as { message?: string })?.message ?? 'Could not load incoming updates.'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [activeProjectId, invokeGit, refreshStatus]
  )

  const requestPull = useCallback(async (): Promise<void> => {
    const nextPreview = await loadPreview(true)
    if (nextPreview && nextPreview.behind_count > 0) {
      if (activeProjectId) {
        lastShownRef.current[activeProjectId] = getPreviewFingerprint(nextPreview)
      }
      setShowDialog(true)
      return
    }

    await pull()
  }, [activeProjectId, loadPreview, pull])

  const confirmPull = useCallback((): void => {
    setShowDialog(false)
    void pull()
  }, [pull])

  const close = useCallback((): void => {
    setShowDialog(false)
  }, [])

  useEffect(() => {
    if (!activeProjectId || !enabled || !currentBranch) return

    let cancelled = false
    let checking = false

    const checkIncomingUpdates = async (): Promise<void> => {
      if (checking || cancelled || showDialog) return
      checking = true
      try {
        const nextPreview = await loadPreview()
        if (cancelled || !nextPreview || nextPreview.behind_count <= 0) return

        const fingerprint = getPreviewFingerprint(nextPreview)
        if (lastShownRef.current[activeProjectId] === fingerprint) return

        lastShownRef.current[activeProjectId] = fingerprint
        setShowDialog(true)
      } finally {
        checking = false
      }
    }

    void checkIncomingUpdates()
    const interval = window.setInterval(() => {
      void checkIncomingUpdates()
    }, 60_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [activeProjectId, currentBranch, enabled, loadPreview, showDialog])

  return {
    preview,
    loading,
    error,
    showDialog,
    loadPreview,
    requestPull,
    confirmPull,
    close,
    reset
  }
}
