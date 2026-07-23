import { ipcMain, dialog } from 'electron'
import type { ExportFormat, ModpackProject } from '@shared/types'
import { exportToFolder } from '../services/export/folderExport'
import { exportMrpack } from '../services/export/mrpack'
import { exportCurseForgeZip } from '../services/export/curseforgeZip'

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'modpack'
}

export function registerExportIpc(): void {
  ipcMain.handle('export:pickDestination', async (_event, format: ExportFormat, projectName: string) => {
    const base = sanitizeFilename(projectName)

    if (format === 'folder') {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
      if (result.canceled || result.filePaths.length === 0) return undefined
      return result.filePaths[0]
    }

    const extension = format === 'mrpack' ? 'mrpack' : 'zip'
    const result = await dialog.showSaveDialog({
      defaultPath: `${base}.${extension}`,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    })
    if (result.canceled || !result.filePath) return undefined
    return result.filePath
  })

  ipcMain.handle('export:run', (_event, project: ModpackProject, format: ExportFormat, outputPath: string) => {
    if (format === 'folder') return exportToFolder(project, outputPath)
    if (format === 'mrpack') return exportMrpack(project, outputPath)
    return exportCurseForgeZip(project, outputPath)
  })
}
