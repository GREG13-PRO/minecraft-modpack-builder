import { ipcMain } from 'electron'
import * as secureSettings from '../services/secureSettings'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:hasCurseForgeApiKey', () => secureSettings.hasCurseForgeApiKey())
  ipcMain.handle('settings:setCurseForgeApiKey', (_event, key: string) => secureSettings.setCurseForgeApiKey(key))
  ipcMain.handle('settings:clearCurseForgeApiKey', () => secureSettings.clearCurseForgeApiKey())
}
