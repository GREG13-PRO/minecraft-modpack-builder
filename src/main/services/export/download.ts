import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import type { ModpackMod } from '@shared/types'

export const CONTENT_SUBFOLDER = {
  mod: 'mods',
  resourcepack: 'resourcepacks',
  shader: 'shaderpacks'
} as const

// CurseForge sets downloadUrl to null when the mod author has disabled
// third-party distribution — there is no legal way to fetch that file
// ourselves in that case, so callers must treat this as "cannot download".
export function canDownload(mod: ModpackMod): boolean {
  return Boolean(mod.pinnedVersion.downloadUrl)
}

export async function fetchModBuffer(mod: ModpackMod): Promise<Buffer> {
  const url = mod.pinnedVersion.downloadUrl
  if (!url) throw new Error('No download URL available for this file')

  const filename = mod.pinnedVersion.filename || `${mod.ref.slug}-${mod.pinnedVersion.versionId}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}) for ${filename}`)

  const buffer = Buffer.from(await response.arrayBuffer())

  if (mod.pinnedVersion.sha1) {
    const actualSha1 = createHash('sha1').update(buffer).digest('hex')
    if (actualSha1 !== mod.pinnedVersion.sha1) {
      throw new Error(`Hash mismatch for ${filename} — download may be corrupted`)
    }
  }

  return buffer
}

export async function downloadModFile(mod: ModpackMod, destDir: string): Promise<string> {
  const buffer = await fetchModBuffer(mod)
  const filename = mod.pinnedVersion.filename || `${mod.ref.slug}-${mod.pinnedVersion.versionId}`
  const destPath = `${destDir}/${filename}`
  await fs.mkdir(destDir, { recursive: true })
  await fs.writeFile(destPath, buffer)
  return destPath
}
