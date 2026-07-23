import { ipcMain, dialog } from 'electron'
import type { LauncherStatus, LauncherType } from '@shared/types'
import * as launcherSettings from '../services/launcherSettings'
import { detectLauncherPath, launchExecutable } from '../services/launcher/launch'

export function registerLauncherIpc(): void {
  ipcMain.handle('launcher:getStatus', async (): Promise<LauncherStatus> => {
    const settings = await launcherSettings.getLauncherSettings()
    const detectedPath = await detectLauncherPath(settings.type)
    return { type: settings.type, path: settings.path, detectedPath }
  })

  ipcMain.handle('launcher:setType', (_event, type: LauncherType) => launcherSettings.setLauncherType(type))

  ipcMain.handle('launcher:pickExecutable', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters:
        process.platform === 'win32'
          ? [{ name: 'Executable', extensions: ['exe'] }]
          : [{ name: 'Application', extensions: ['app'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return undefined
    const path = result.filePaths[0]
    await launcherSettings.setLauncherPath(path)
    return path
  })

  ipcMain.handle('launcher:launch', async () => {
    const settings = await launcherSettings.getLauncherSettings()
    const path = settings.path ?? (await detectLauncherPath(settings.type))
    if (!path) throw new Error('No launcher path configured or detected')
    await launchExecutable(path)
  })
}
