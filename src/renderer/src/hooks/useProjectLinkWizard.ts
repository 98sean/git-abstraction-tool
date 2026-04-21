import { useCallback, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { invokeDb } from '../ipc'
import { Project, ProjectFolderInspection } from '../types'

export type ProjectLinkWizardStep = 'choose' | 'prepare' | 'warnings' | 'review'

interface UseProjectLinkWizardOptions {
  onLinked?: (project: Project) => void
}

function getFolderName(folderPath: string): string {
  const normalizedPath = folderPath.replace(/\\/g, '/')
  const parts = normalizedPath.split('/')
  return parts[parts.length - 1] || 'My Project'
}

function getNextStep(inspection: ProjectFolderInspection): ProjectLinkWizardStep {
  if (!inspection.isGitRepo && inspection.canInitialize) {
    return 'prepare'
  }

  if (inspection.warnings.length > 0) {
    return 'warnings'
  }

  return 'review'
}

export function useProjectLinkWizard(options: UseProjectLinkWizardOptions = {}) {
  const { dispatch } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<ProjectLinkWizardStep>('choose')
  const [inspection, setInspection] = useState<ProjectFolderInspection | null>(null)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [friendlyName, setFriendlyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIgnoreEntries, setSelectedIgnoreEntries] = useState<string[]>([])
  const [shouldInitializeGit, setShouldInitializeGit] = useState(false)

  const reset = useCallback(() => {
    setStep('choose')
    setInspection(null)
    setFolderPath(null)
    setFriendlyName('')
    setLoading(false)
    setError(null)
    setSelectedIgnoreEntries([])
    setShouldInitializeGit(false)
  }, [])

  const open = useCallback(() => {
    reset()
    setIsOpen(true)
  }, [reset])

  const close = useCallback(() => {
    reset()
    setIsOpen(false)
  }, [reset])

  const chooseFolder = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const selectedFolder = await invokeDb<string | null>('dialog:openFolder')
      if (!selectedFolder) {
        return
      }

      const nextInspection = await invokeDb<ProjectFolderInspection>('project-setup:inspect', selectedFolder)

      setFolderPath(selectedFolder)
      setFriendlyName(getFolderName(selectedFolder))
      setInspection(nextInspection)
      setSelectedIgnoreEntries(nextInspection.recommendedIgnoreEntries)
      setShouldInitializeGit(false)
      setStep(getNextStep(nextInspection))
    } catch {
      setError('Could not inspect that folder. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const approveInit = useCallback(() => {
    if (!inspection) return

    setShouldInitializeGit(true)
    setStep(inspection.warnings.length > 0 ? 'warnings' : 'review')
  }, [inspection])

  const toggleIgnoreEntry = useCallback((entry: string) => {
    setSelectedIgnoreEntries((currentEntries) =>
      currentEntries.includes(entry)
        ? currentEntries.filter((currentEntry) => currentEntry !== entry)
        : [...currentEntries, entry]
    )
  }, [])

  const finish = useCallback(async () => {
    if (!folderPath) {
      setError('Choose a project folder before linking it.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const project = await invokeDb<Project>('project-setup:finalize-link', {
        localPath: folderPath,
        friendlyName,
        shouldInitializeGit,
        ignoreEntries: selectedIgnoreEntries
      })
      const projects = await invokeDb<Project[]>('db:projects:list')

      dispatch({ type: 'SET_PROJECTS', projects })
      dispatch({ type: 'SET_ACTIVE_PROJECT', project_id: project.project_id })
      options.onLinked?.(project)
      close()
    } catch {
      setError('Could not finish linking that project.')
    } finally {
      setLoading(false)
    }
  }, [
    close,
    dispatch,
    folderPath,
    friendlyName,
    options,
    selectedIgnoreEntries,
    shouldInitializeGit
  ])

  return {
    isOpen,
    step,
    inspection,
    folderPath,
    friendlyName,
    loading,
    error,
    selectedIgnoreEntries,
    open,
    close,
    chooseFolder,
    approveInit,
    toggleIgnoreEntry,
    finish
  }
}
