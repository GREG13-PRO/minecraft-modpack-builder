import { ipcMain, dialog } from 'electron'
import type { LauncherStatus, LauncherType, LaunchResult, ModLoader } from '@shared/types'
import * as launcherSettings from '../services/launcherSettings'
import { detectLauncherPath, launchExecutable } from '../services/launcher/launch'
import { getMinecraftDir, findInstalledVersionId } from '../services/launcher/versions'
import { upsertLauncherProfile } from '../services/launcher/profiles'

export function registerLauncherIpc(): void {
  ipcMain.handle('launcher:getStatus', async (): Promise<LauncherStatus> => {
    const settings = await launcherSettings.getLauncherSettings()
    const detectedPath = await detectLauncherPath(settings.type)
    return { type: settings.type, path: settings.path, detectedPath }
  })

  ipcMain.handle('launcher:setType', (_event, type: LauncherType) =>
    launcherSettings.setLauncherType(type)
  )

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

  ipcMain.handle(
    'launcher:launch',
    async (
      _event,
      projectId: string,
      projectName: string,
      mcVersion: string,
      loader: ModLoader,
      gameDir: string | undefined
    ): Promise<LaunchResult> => {
      const settings = await launcherSettings.getLauncherSettings()
      const path = settings.path ?? (await detectLauncherPath(settings.type))
      if (!path) throw new Error('No launcher path configured or detected')

      const minecraftDir = getMinecraftDir()
      const versionId = await findInstalledVersionId(minecraftDir, mcVersion, loader)

      let profileOutcome: LaunchResult['profileOutcome']
      if (!versionId) {
        profileOutcome = 'version-not-installed'
      } else {
        const wrote = await upsertLauncherProfile(
          minecraftDir,
          `modpack-builder-${projectId}`,
          projectName,
          versionId,
          gameDir
        )
        profileOutcome = wrote ? 'configured' : 'profiles-file-unavailable'
      }

      await launchExecutable(path)
      return { profileOutcome, versionId }
    }
  )
}
