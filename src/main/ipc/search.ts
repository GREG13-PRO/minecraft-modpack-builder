import { ipcMain } from 'electron'
import type { ModSearchParams, ModRef } from '@shared/types'
import * as modService from '../services/modService'

export function registerSearchIpc(): void {
  ipcMain.handle('search:mods', (_event, params: ModSearchParams) => modService.searchMods(params))

  ipcMain.handle(
    'search:versions',
    (_event, ref: ModRef, mcVersion: string, loader: string) => modService.listVersions(ref, mcVersion, loader)
  )

  ipcMain.handle('search:gameVersions', () => modService.getReleaseGameVersions())
}
