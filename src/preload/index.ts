import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ApiKeyTestResult,
  ContentType,
  DependencyLookup,
  ExportFormat,
  ExportResult,
  InstalledModScanResult,
  LaunchResult,
  LauncherStatus,
  LauncherType,
  ModLoader,
  ModpackProject,
  ModRef,
  ModSearchParams,
  UpdaterStatus
} from '@shared/types'

const api = {
  search: {
    searchMods: (params: ModSearchParams) => ipcRenderer.invoke('search:mods', params),
    listVersions: (ref: ModRef, mcVersion: string, loader: ModLoader, contentType: ContentType) =>
      ipcRenderer.invoke('search:versions', ref, mcVersion, loader, contentType),
    gameVersions: () => ipcRenderer.invoke('search:gameVersions') as Promise<string[]>,
    resolveRefs: (refs: DependencyLookup[]) =>
      ipcRenderer.invoke('search:resolveRefs', refs) as Promise<ModRef[]>
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    save: (project: ModpackProject) => ipcRenderer.invoke('projects:save', project),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
  },
  settings: {
    hasCurseForgeApiKey: () =>
      ipcRenderer.invoke('settings:hasCurseForgeApiKey') as Promise<boolean>,
    setCurseForgeApiKey: (key: string) =>
      ipcRenderer.invoke('settings:setCurseForgeApiKey', key) as Promise<void>,
    clearCurseForgeApiKey: () =>
      ipcRenderer.invoke('settings:clearCurseForgeApiKey') as Promise<void>,
    testCurseForgeApiKey: (key: string) =>
      ipcRenderer.invoke('settings:testCurseForgeApiKey', key) as Promise<ApiKeyTestResult>
  },
  scan: {
    pickFolder: () => ipcRenderer.invoke('scan:pickFolder') as Promise<string | undefined>,
    run: (folderPath: string, mcVersion: string, loader: ModLoader) =>
      ipcRenderer.invoke('scan:run', folderPath, mcVersion, loader) as Promise<
        InstalledModScanResult[]
      >
  },
  export: {
    pickDestination: (format: ExportFormat, projectName: string) =>
      ipcRenderer.invoke('export:pickDestination', format, projectName) as Promise<
        string | undefined
      >,
    run: (project: ModpackProject, format: ExportFormat, outputPath: string) =>
      ipcRenderer.invoke('export:run', project, format, outputPath) as Promise<ExportResult>
  },
  launcher: {
    getStatus: () => ipcRenderer.invoke('launcher:getStatus') as Promise<LauncherStatus>,
    setType: (type: LauncherType) => ipcRenderer.invoke('launcher:setType', type) as Promise<void>,
    pickExecutable: () =>
      ipcRenderer.invoke('launcher:pickExecutable') as Promise<string | undefined>,
    launch: (
      projectId: string,
      projectName: string,
      mcVersion: string,
      loader: ModLoader,
      gameDir: string | undefined
    ) =>
      ipcRenderer.invoke(
        'launcher:launch',
        projectId,
        projectName,
        mcVersion,
        loader,
        gameDir
      ) as Promise<LaunchResult>
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check') as Promise<void>,
    download: () => ipcRenderer.invoke('updater:download') as Promise<void>,
    install: () => ipcRenderer.invoke('updater:install') as Promise<void>,
    getVersion: () => ipcRenderer.invoke('updater:getVersion') as Promise<string>,
    onStatus: (callback: (status: UpdaterStatus) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: UpdaterStatus): void =>
        callback(status)
      ipcRenderer.on('updater:status', listener)
      return (): void => {
        ipcRenderer.removeListener('updater:status', listener)
      }
    }
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
