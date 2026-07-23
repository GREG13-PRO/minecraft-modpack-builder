import { ipcMain } from 'electron'
import type { ModpackProject } from '@shared/types'
import * as projectStore from '../services/projectStore'

export function registerProjectsIpc(): void {
  ipcMain.handle('projects:list', () => projectStore.listProjects())
  ipcMain.handle('projects:save', (_event, project: ModpackProject) => projectStore.saveProject(project))
  ipcMain.handle('projects:delete', (_event, id: string) => projectStore.deleteProject(id))
}
