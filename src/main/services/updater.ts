import { ipcMain, app, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdaterStatus } from '@shared/types'

// Never download or install silently — the user must explicitly opt in via
// the UI for both steps, since this ships to people's personal MC installs.
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

function sendStatus(window: BrowserWindow, status: UpdaterStatus): void {
  if (window.isDestroyed()) return
  window.webContents.send('updater:status', status)
}

export function registerUpdaterIpc(mainWindow: BrowserWindow): void {
  autoUpdater.on('checking-for-update', () => sendStatus(mainWindow, { state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    sendStatus(mainWindow, { state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => sendStatus(mainWindow, { state: 'not-available' }))
  autoUpdater.on('download-progress', (progress) =>
    sendStatus(mainWindow, { state: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    sendStatus(mainWindow, { state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (err) => sendStatus(mainWindow, { state: 'error', message: err.message }))

  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall())
  ipcMain.handle('updater:getVersion', () => app.getVersion())
}

export function checkForUpdatesSilently(): void {
  autoUpdater.checkForUpdates().catch(() => {
    // Silent background check — surfaced errors only matter when the user
    // explicitly asks via the Settings "Check for Updates" button.
  })
}
