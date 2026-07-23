import { create } from 'zustand'
import type { ContentType, ModLoader, ModpackMod, ModpackProject } from '@shared/types'

const FIELD: Record<ContentType, 'mods' | 'resourcePacks' | 'shaders'> = {
  mod: 'mods',
  resourcepack: 'resourcePacks',
  shader: 'shaders'
}

interface ProjectState {
  project: ModpackProject | null
  createProject: (name: string, mcVersion: string, loader: ModLoader) => void
  loadProject: (project: ModpackProject) => void
  newProject: () => void
  addItem: (contentType: ContentType, mod: ModpackMod) => void
  removeItem: (contentType: ContentType, projectId: string, source: string) => void
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
        resourcePacks: [],
        shaders: [],
        createdAt: now,
        updatedAt: now
      }
      window.api.projects.save(project)
      return { project }
    }),

  loadProject: (project) =>
    set({
      project: {
        ...project,
        resourcePacks: project.resourcePacks ?? [],
        shaders: project.shaders ?? []
      }
    }),

  newProject: () => set({ project: null }),

  addItem: (contentType, mod) =>
    set((state) => {
      if (!state.project) return state
      const field = FIELD[contentType]
      const items = state.project[field]
      const alreadyAdded = items.some((m) => m.ref.source === mod.ref.source && m.ref.projectId === mod.ref.projectId)
      if (alreadyAdded) return state
      const project = { ...state.project, [field]: [...items, mod] }
      window.api.projects.save(project)
      return { project }
    }),

  removeItem: (contentType, projectId, source) =>
    set((state) => {
      if (!state.project) return state
      const field = FIELD[contentType]
      const project = {
        ...state.project,
        [field]: state.project[field].filter((m) => !(m.ref.projectId === projectId && m.ref.source === source))
      }
      window.api.projects.save(project)
      return { project }
    })
}))
