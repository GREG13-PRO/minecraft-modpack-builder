import { promises as fs } from 'fs'
import type { ModRef, ModVersionRef } from '@shared/types'
import { sha1Hex, curseForgeFingerprint } from './fingerprint'
import * as modrinth from '../modrinth/client'
import { toModVersionRef as toModrinthVersionRef, projectToModRef } from '../modrinth/mapper'
import * as curseforge from '../curseforge/client'
import { MissingApiKeyError } from '../curseforge/client'
import { toModRef as toCurseForgeRef, toModVersionRef as toCurseForgeVersionRef } from '../curseforge/mapper'
import { readJarMetadata } from './jarInspector'
import { parseFabricModJson, type ParsedModIdentity } from './parsers/fabric'
import { parseModsToml, isUnresolvedVersionPlaceholder, parseManifestImplementationVersion } from './parsers/forgeToml'
import { parseMcmodInfo } from './parsers/legacyForge'

export interface JarHashes {
  filePath: string
  buffer: Buffer
  sha1: string
  fingerprint: number
}

export async function hashJar(filePath: string): Promise<JarHashes> {
  const buffer = await fs.readFile(filePath)
  return { filePath, buffer, sha1: sha1Hex(buffer), fingerprint: curseForgeFingerprint(buffer) }
}

export interface HashMatch {
  ref: ModRef
  version: ModVersionRef
}

// Batch-resolves jars to their exact published version via content hash —
// Modrinth's version_files and CurseForge's fingerprints endpoints both do
// this directly, sidestepping fragile jar-metadata parsing entirely.
export async function matchByHash(jars: JarHashes[]): Promise<Map<string, HashMatch>> {
  const results = new Map<string, HashMatch>()
  if (jars.length === 0) return results

  const [modrinthMatches, curseforgeMatches] = await Promise.all([
    matchModrinth(jars),
    matchCurseForge(jars)
  ])

  for (const [path, match] of modrinthMatches) results.set(path, match)
  // CurseForge fills in only what Modrinth didn't already resolve.
  for (const [path, match] of curseforgeMatches) if (!results.has(path)) results.set(path, match)

  return results
}

async function matchModrinth(jars: JarHashes[]): Promise<Map<string, HashMatch>> {
  const results = new Map<string, HashMatch>()
  try {
    const bySha1 = await modrinth.getVersionsByHashes(
      jars.map((j) => j.sha1),
      'sha1'
    )
    const projectIds = [...new Set(Object.values(bySha1).map((v) => v.project_id))]
    const projects = await modrinth.getProjectsByIds(projectIds)
    const projectById = new Map(projects.map((p) => [p.id, p]))

    for (const jar of jars) {
      const version = bySha1[jar.sha1]
      const project = version && projectById.get(version.project_id)
      if (version && project) {
        results.set(jar.filePath, { ref: projectToModRef(project), version: toModrinthVersionRef(version) })
      }
    }
  } catch {
    // Non-fatal: fall through to CurseForge matching / metadata fallback.
  }
  return results
}

async function matchCurseForge(jars: JarHashes[]): Promise<Map<string, HashMatch>> {
  const results = new Map<string, HashMatch>()
  try {
    const byFingerprint = new Map(jars.map((j) => [j.fingerprint, j]))
    const { data } = await curseforge.matchFingerprints(jars.map((j) => j.fingerprint))
    const modIds = [...new Set(data.exactMatches.map((m) => m.file.modId))]
    const { data: mods } = await curseforge.getModsByIds(modIds)
    const modById = new Map(mods.map((m) => [m.id, m]))

    // `match.id` is the input fingerprint that matched; `match.file` is the resolved file.
    for (const match of data.exactMatches) {
      const jar = byFingerprint.get(match.id)
      const mod = modById.get(match.file.modId)
      if (jar && mod) {
        results.set(jar.filePath, { ref: toCurseForgeRef(mod), version: toCurseForgeVersionRef(match.file) })
      }
    }
  } catch (err) {
    if (!(err instanceof MissingApiKeyError)) throw err
  }
  return results
}

// Fallback identity for jars no hash matched: parsed straight from the jar's
// own metadata, so the user at least sees a name/version even with no
// online match (status "unrecognized").
export async function identifyFromMetadata(filePath: string): Promise<ParsedModIdentity | undefined> {
  const entries = await readJarMetadata(filePath).catch(() => ({}))

  if (entries['fabric.mod.json']) {
    const identity = parseFabricModJson(entries['fabric.mod.json'])
    if (identity) return identity
  }

  const toml = entries['META-INF/mods.toml'] ?? entries['META-INF/neoforge.mods.toml']
  if (toml) {
    const identity = parseModsToml(toml)
    if (identity) {
      if (isUnresolvedVersionPlaceholder(identity.version) && entries['META-INF/MANIFEST.MF']) {
        identity.version = parseManifestImplementationVersion(entries['META-INF/MANIFEST.MF']) ?? identity.version
      }
      return identity
    }
  }

  if (entries['mcmod.info']) {
    const identity = parseMcmodInfo(entries['mcmod.info'])
    if (identity) return identity
  }

  return undefined
}
