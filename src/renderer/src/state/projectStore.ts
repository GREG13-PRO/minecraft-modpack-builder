import { create } from 'zustand'
import type { ModLoader, ModpackMod, ModpackProject } from '@shared/types'

interface ProjectState {
  project: ModpackProject | null
  createProject: (name: string, mcVersion: string, loader: ModLoader) => void
  loadProject: (project: ModpackProject) => void
  newProject: () => void
  addMod: (mod: ModpackMod) => void
  removeMod: (projectId: string, source: string) => void
}

function newProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,

  createProject: (name, mcVersion, loader) =>
    set(() => {
      const now = new Date().toISOString()
      const project: ModpackProject = {
        id: newProjectId(),
        name,
        mcVersion: { id: mcVersion, type: 'release' },
        loader,
        mods: [],
        createdAt: now,
        updatedAt: now
      }
      window.api.projects.save(project)
      return { project }
    }),

  loadProject: (project) => set({ project }),

  newProject: () => set({ project: null }),

  addMod: (mod) =>
    set((state) => {
      if (!state.project) return state
      const alreadyAdded = state.project.mods.some(
        (m) => m.ref.source === mod.ref.source && m.ref.projectId === mod.ref.projectId
      )
      if (alreadyAdded) return state
      const project = { ...state.project, mods: [...state.project.mods, mod] }
      window.api.projects.save(project)
      return { project }
    }),

  removeMod: (projectId, source) =>
    set((state) => {
      if (!state.project) return state
      const project = {
        ...state.project,
        mods: state.project.mods.filter((m) => !(m.ref.projectId === projectId && m.ref.source === source))
      }
      window.api.projects.save(project)
      return { project }
    })
}))
