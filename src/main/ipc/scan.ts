import { ipcMain, dialog } from 'electron'
import type { ModLoader } from '@shared/types'
import { scanFolder } from '../services/scanner/scanFolder'

export function registerScanIpc(): void {
  ipcMain.handle('scan:pickFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return undefined
    return result.filePaths[0]
  })

  ipcMain.handle('scan:run', (_event, folderPath: string, mcVersion: string, loader: ModLoader) =>
    scanFolder(folderPath, mcVersion, loader)
  )
}
