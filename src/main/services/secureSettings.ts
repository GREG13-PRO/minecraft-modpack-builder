import { app, safeStorage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

function settingsPath(): string {
  return join(app.getPath('userData'), 'secure-settings.json')
}

interface SecureSettingsFile {
  curseForgeApiKey?: string // base64-encoded, safeStorage-encrypted
}

async function readFile(): Promise<SecureSettingsFile> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8')
    return JSON.parse(raw) as SecureSettingsFile
  } catch {
    return {}
  }
}

async function writeFile(data: SecureSettingsFile): Promise<void> {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(settingsPath(), JSON.stringify(data, null, 2), 'utf-8')
}

export async function getCurseForgeApiKey(): Promise<string | undefined> {
  const data = await readFile()
  if (!data.curseForgeApiKey) return undefined
  if (!safeStorage.isEncryptionAvailable()) return undefined
  try {
    return safeStorage.decryptString(Buffer.from(data.curseForgeApiKey, 'base64'))
  } catch {
    return undefined
  }
}

export async function hasCurseForgeApiKey(): Promise<boolean> {
  const data = await readFile()
  return Boolean(data.curseForgeApiKey)
}

export async function setCurseForgeApiKey(key: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is not available on this system')
  }
  const encrypted = safeStorage.encryptString(key).toString('base64')
  const data = await readFile()
  await writeFile({ ...data, curseForgeApiKey: encrypted })
}

export async function clearCurseForgeApiKey(): Promise<void> {
  const data = await readFile()
  delete data.curseForgeApiKey
  await writeFile(data)
}
