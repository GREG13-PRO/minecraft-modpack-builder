import { promises as fs } from 'fs'
import { join } from 'path'
import type { InstalledModScanResult, ModLoader } from '@shared/types'
import { hashJar, matchByHash, identifyFromMetadata, type HashMatch } from './identity'
import * as modService from '../modService'

export async function scanFolder(
  folderPath: string,
  mcVersion: string,
  loader: ModLoader
): Promise<InstalledModScanResult[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const jarPaths = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.jar'))
    .map((e) => join(folderPath, e.name))

  if (jarPaths.length === 0) return []

  const jars = await Promise.all(jarPaths.map(hashJar))
  const hashMatches = await matchByHash(jars)

  const results = await Promise.all(
    jars.map(async (jar): Promise<InstalledModScanResult> => {
      const hashMatch = hashMatches.get(jar.filePath)

      if (hashMatch) {
        return classifyMatched(jar.filePath, hashMatch, mcVersion, loader)
      }

      const identity = await identifyFromMetadata(jar.filePath)
      return {
        filePath: jar.filePath,
        detectedIdentity: identity
          ? { modId: identity.modId, name: identity.name, version: identity.version, source: 'unknown' }
          : undefined,
        status: 'unrecognized'
      }
    })
  )

  return results
}

async function classifyMatched(
  filePath: string,
  hashMatch: HashMatch,
  mcVersion: string,
  loader: ModLoader
): Promise<InstalledModScanResult> {
  const { ref, version } = hashMatch
  const alreadyCompatible = version.gameVersions.includes(mcVersion) && version.loaders.includes(loader)

  if (alreadyCompatible) {
    return { filePath, matchedRef: ref, matchedVersion: version, status: 'up-to-date' }
  }

  // Installed file doesn't match the target — see if a compatible build exists.
  try {
    const candidates = await modService.listVersions(ref, mcVersion, loader)
    if (candidates.length === 0) {
      return { filePath, matchedRef: ref, matchedVersion: version, status: 'incompatible-loader' }
    }
    const latest = candidates[0]
    return {
      filePath,
      matchedRef: ref,
      matchedVersion: version,
      latestCompatibleVersion: latest,
      status: 'outdated'
    }
  } catch {
    return { filePath, matchedRef: ref, matchedVersion: version, status: 'not-on-target-mc-version' }
  }
}
