import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ApiKeyTestResult,
  ContentType,
  InstalledModScanResult,
  ModLoader,
  ModpackProject,
  ModRef,
  ModSearchParams
} from '@shared/types'

const api = {
  search: {
    searchMods: (params: ModSearchParams) => ipcRenderer.invoke('search:mods', params),
    listVersions: (ref: ModRef, mcVersion: string, loader: ModLoader, contentType: ContentType) =>
      ipcRenderer.invoke('search:versions', ref, mcVersion, loader, contentType),
    gameVersions: () => ipcRenderer.invoke('search:gameVersions') as Promise<string[]>
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    save: (project: ModpackProject) => ipcRenderer.invoke('projects:save', project),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
  },
  settings: {
    hasCurseForgeApiKey: () => ipcRenderer.invoke('settings:hasCurseForgeApiKey') as Promise<boolean>,
    setCurseForgeApiKey: (key: string) => ipcRenderer.invoke('settings:setCurseForgeApiKey', key) as Promise<void>,
    clearCurseForgeApiKey: () => ipcRenderer.invoke('settings:clearCurseForgeApiKey') as Promise<void>,
    testCurseForgeApiKey: (key: string) =>
      ipcRenderer.invoke('settings:testCurseForgeApiKey', key) as Promise<ApiKeyTestResult>
  },
  scan: {
    pickFolder: () => ipcRenderer.invoke('scan:pickFolder') as Promise<string | undefined>,
    run: (folderPath: string, mcVersion: string, loader: ModLoader) =>
      ipcRenderer.invoke('scan:run', folderPath, mcVersion, loader) as Promise<InstalledModScanResult[]>
  }
}

export type ModpackApi = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
