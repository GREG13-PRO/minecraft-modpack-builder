import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { ModLoader } from '@shared/types'

const LOADER_KEYWORD: Record<ModLoader, string> = {
  forge: 'forge',
  fabric: 'fabric',
  neoforge: 'neoforge',
  quilt: 'quilt'
}

// Both the official launcher and TLauncher use this folder by default
// (TLauncher shares it deliberately, to reuse assets/mods/saves with a
// vanilla install) — a user-customized game directory isn't detected here.
export function getMinecraftDir(): string {
  if (process.platform === 'win32') {
    return join(process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming'), '.minecraft')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'minecraft')
  }
  return join(homedir(), '.minecraft')
}

interface VersionJson {
  id: string
  inheritsFrom?: string
}

// We never install a mod loader ourselves — this only looks for a version
// already installed (via the loader's own installer) that matches the
// project's Minecraft version and loader, so the launcher profile can be
// pointed at it.
export async function findInstalledVersionId(
  minecraftDir: string,
  mcVersion: string,
  loader: ModLoader
): Promise<string | undefined> {
  const versionsDir = join(minecraftDir, 'versions')
  let entries: string[]
  try {
    entries = await fs.readdir(versionsDir)
  } catch {
    return undefined
  }

  const keyword = LOADER_KEYWORD[loader]
  const candidates: { id: string; mtimeMs: number }[] = []

  for (const id of entries) {
    try {
      const jsonPath = join(versionsDir, id, `${id}.json`)
      const raw = await fs.readFile(jsonPath, 'utf-8')
      const parsed = JSON.parse(raw) as VersionJson
      const base = parsed.inheritsFrom ?? parsed.id
      if (base !== mcVersion) continue
      if (!id.toLowerCase().includes(keyword)) continue
      const stat = await fs.stat(join(versionsDir, id))
      candidates.push({ id, mtimeMs: stat.mtimeMs })
    } catch {
      continue
    }
  }

  if (candidates.length === 0) return undefined
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return candidates[0].id
}
