import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { LauncherSettings, LauncherType } from '@shared/types'

function settingsPath(): string {
  return join(app.getPath('userData'), 'launcher-settings.json')
}

async function readFile(): Promise<LauncherSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8')
    return JSON.parse(raw) as LauncherSettings
  } catch {
    return { type: 'official' }
  }
}

async function writeFile(data: LauncherSettings): Promise<void> {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(settingsPath(), JSON.stringify(data, null, 2), 'utf-8')
}

export async function getLauncherSettings(): Promise<LauncherSettings> {
  return readFile()
}

export async function setLauncherType(type: LauncherType): Promise<void> {
  const data = await readFile()
  await writeFile({ ...data, type })
}

export async function setLauncherPath(path: string): Promise<void> {
  const data = await readFile()
  await writeFile({ ...data, path })
}
