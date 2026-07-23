import { ipcMain } from 'electron'
import type { ModSearchParams, ModRef, ModLoader } from '@shared/types'
import * as modService from '../services/modService'

export function registerSearchIpc(): void {
  ipcMain.handle('search:mods', (_event, params: ModSearchParams) => modService.searchMods(params))

  ipcMain.handle(
    'search:versions',
    (_event, ref: ModRef, mcVersion: string, loader: ModLoader) => modService.listVersions(ref, mcVersion, loader)
  )

  ipcMain.handle('search:gameVersions', () => modService.getReleaseGameVersions())
}
