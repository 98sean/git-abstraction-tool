import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { invokeDb } from '../ipc'
import { Project } from '../types'

export function useProjects(): {
  projects: Project[]
  activeProjectId: string | null
  activeProject: Project | null
  addProject: (local_path: string, friendly_name: string) => Promise<Project>
  removeProject: (project_id: string) => Promise<void>
  setActiveProject: (project_id: string) => void
} {
  const { state, dispatch } = useAppContext()

  const refreshProjects = useCallback(async (): Promise<Project[]> => {
    const projects = await invokeDb<Project[]>('db:projects:list')
    dispatch({ type: 'SET_PROJECTS', projects })
    return projects
  }, [dispatch])

  const addProject = useCallback(
    async (local_path: string, friendly_name: string): Promise<Project> => {
      const project = await invokeDb<Project>('db:projects:add', local_path, friendly_name)
      await refreshProjects()
      dispatch({ type: 'SET_ACTIVE_PROJECT', project_id: project.project_id })
      return project
    },
    [dispatch, refreshProjects]
  )

  const removeProject = useCallback(
    async (project_id: string): Promise<void> => {
      await invokeDb('db:projects:remove', project_id)
      const projects = await refreshProjects()
      if (state.activeProjectId === project_id) {
        dispatch({ type: 'SET_ACTIVE_PROJECT', project_id: projects[0]?.project_id ?? null })
      }
    },
    [dispatch, refreshProjects, state.activeProjectId]
  )

  const setActiveProject = useCallback(
    (project_id: string): void => {
      dispatch({ type: 'SET_ACTIVE_PROJECT', project_id })
      invokeDb('db:projects:touch', project_id).catch(console.error)
    },
    [dispatch]
  )

  return {
    projects: state.projects,
    activeProjectId: state.activeProjectId,
    activeProject: state.projects.find((p) => p.project_id === state.activeProjectId) ?? null,
    addProject,
    removeProject,
    setActiveProject
  }
}
