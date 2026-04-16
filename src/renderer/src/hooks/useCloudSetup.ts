import { useCallback, useEffect, useState } from 'react'
import { invokeDb } from '../ipc'
import {
  CloudSetupIntent,
  CollaborationBranchMode,
  Project,
  ProjectCloudTarget,
  ProjectFolderInspection,
  ProjectRemote
} from '../types'

const emptyTarget: ProjectCloudTarget = {
  mode: 'none',
  backup: null,
  collaboration: null
}

interface UseCloudSetupOptions {
  onReadyToUpload?: (target: ProjectCloudTarget) => void | Promise<void>
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'project'
}

function getDefaultWorkBranch(project: Project | null): string {
  return `gat/${slugify(project?.friendly_name ?? 'update')}`
}

function getBackupRepoName(project: Project | null): string {
  return `${slugify(project?.friendly_name ?? 'project')}-backup`
}

function parseGithubRemote(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim()
  const match = trimmed.match(
    /^(?:https:\/\/(?:[^@]+@)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/i
  )

  if (!match) return null

  return {
    owner: match[1],
    repo: match[2]
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useCloudSetup(
  project: Project | null,
  options: UseCloudSetupOptions = {}
) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<ProjectCloudTarget>(emptyTarget)
  const [remotes, setRemotes] = useState<ProjectRemote[]>([])
  const [intent, setIntent] = useState<CloudSetupIntent | null>(null)
  const [branchMode, setBranchMode] = useState<CollaborationBranchMode>('new_branch')
  const [selectedRemoteName, setSelectedRemoteName] = useState('')
  const [selectedBranch, setSelectedBranch] = useState(getDefaultWorkBranch(project))
  const [pendingUpload, setPendingUpload] = useState(false)

  const refreshTarget = useCallback(async () => {
    if (!project) {
      setTarget(emptyTarget)
      return
    }

    const nextTarget = await invokeDb<ProjectCloudTarget>('cloud:target:get', project.project_id)
    setTarget(nextTarget)
  }, [project])

  useEffect(() => {
    refreshTarget().catch(() => {
      setTarget(emptyTarget)
    })
  }, [refreshTarget])

  const resetWizardState = useCallback(() => {
    setError(null)
    setIntent(null)
    setRemotes([])
    setBranchMode('new_branch')
    setSelectedRemoteName('')
    setSelectedBranch(getDefaultWorkBranch(project))
  }, [project])

  const close = useCallback(() => {
    setIsOpen(false)
    setPendingUpload(false)
    resetWizardState()
  }, [resetWizardState])

  const open = useCallback(async (startUpload = false) => {
    if (!project) {
      return
    }

    setIsOpen(true)
    setPendingUpload(startUpload)
    resetWizardState()
    setLoading(true)

    try {
      const inspection = await invokeDb<ProjectFolderInspection>('project-setup:inspect', project.local_path)
      setRemotes(inspection.remotes)
      setSelectedRemoteName(inspection.remotes[0]?.name ?? '')
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not inspect remotes for this project.'))
    } finally {
      setLoading(false)
    }
  }, [project, resetWizardState])

  const chooseIntent = useCallback((nextIntent: CloudSetupIntent) => {
    setIntent(nextIntent)
  }, [])

  const selectRemote = useCallback((remoteName: string) => {
    setSelectedRemoteName(remoteName)
  }, [])

  const selectBranchMode = useCallback((nextBranchMode: CollaborationBranchMode) => {
    setBranchMode(nextBranchMode)
    if (nextBranchMode === 'new_branch') {
      setSelectedBranch(getDefaultWorkBranch(project))
      return
    }

    if (nextBranchMode === 'danger_default_branch') {
      setSelectedBranch('main')
      return
    }

    setSelectedBranch('')
  }, [project])

  const createBackup = useCallback(async () => {
    if (!project) return

    setLoading(true)
    setError(null)

    try {
      const nextTarget = await invokeDb<ProjectCloudTarget>(
        'cloud:backup:create',
        project.project_id,
        getBackupRepoName(project)
      )

      setTarget(nextTarget)
      close()

      if (pendingUpload) {
        Promise.resolve(options.onReadyToUpload?.(nextTarget)).catch(() => undefined)
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not create the private backup repository.'))
    } finally {
      setLoading(false)
    }
  }, [close, options, pendingUpload, project])

  const saveCollaborationTarget = useCallback(async () => {
    if (!project) return

    const selectedRemote = remotes.find((remote) => remote.name === selectedRemoteName)
    if (!selectedRemote) {
      setError('Choose which remote should receive team uploads.')
      return
    }

    const parsedRepository =
      parseGithubRemote(selectedRemote.push) ?? parseGithubRemote(selectedRemote.fetch)

    if (!parsedRepository) {
      setError('This collaboration remote is not a GitHub repository.')
      return
    }

    if (!selectedBranch.trim()) {
      setError('Choose a branch name before saving the team upload target.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextTarget = await invokeDb<ProjectCloudTarget>('cloud:collaboration:set', project.project_id, {
        repoOwner: parsedRepository.owner,
        repoName: parsedRepository.repo,
        remoteName: selectedRemoteName,
        branchMode,
        selectedBranch: selectedBranch.trim()
      })

      setTarget(nextTarget)
      close()

      if (pendingUpload) {
        Promise.resolve(options.onReadyToUpload?.(nextTarget)).catch(() => undefined)
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not save the team upload target.'))
    } finally {
      setLoading(false)
    }
  }, [
    branchMode,
    close,
    options,
    pendingUpload,
    project,
    remotes,
    selectedBranch,
    selectedRemoteName
  ])

  const cloudUploadReady = target.mode !== 'none'
  const cloudStatusLabel =
    target.mode === 'backup'
      ? 'Private backup ready'
      : target.mode === 'collaboration'
        ? `Team upload ready: ${target.collaboration?.remoteName ?? 'configured'}`
        : 'Cloud backup not set up yet'

  return {
    isOpen,
    loading,
    error,
    target,
    remotes,
    intent,
    branchMode,
    selectedRemoteName,
    selectedBranch,
    cloudUploadReady,
    cloudStatusLabel,
    open,
    close,
    chooseIntent,
    selectRemote,
    selectBranchMode,
    setSelectedBranch,
    createBackup,
    saveCollaborationTarget,
    refreshTarget
  }
}
