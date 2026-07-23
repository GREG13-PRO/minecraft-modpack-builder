import type { ModLoader, ModRef, ModVersionRef } from '@shared/types'
import type { CurseForgeFile, CurseForgeMod } from './client'

const LOADER_TAGS: Record<string, ModLoader> = {
  forge: 'forge',
  fabric: 'fabric',
  quilt: 'quilt',
  neoforge: 'neoforge'
}

export function toModRef(mod: CurseForgeMod): ModRef {
  return {
    source: 'curseforge',
    projectId: String(mod.id),
    slug: mod.slug,
    name: mod.name,
    iconUrl: mod.logo?.thumbnailUrl,
    summary: mod.summary
  }
}

function splitGameVersionsAndLoaders(entries: string[]): { gameVersions: string[]; loaders: ModLoader[] } {
  const gameVersions: string[] = []
  const loaders: ModLoader[] = []
  for (const entry of entries) {
    const loader = LOADER_TAGS[entry.toLowerCase()]
    if (loader) {
      loaders.push(loader)
    } else if (/^\d/.test(entry)) {
      gameVersions.push(entry)
    }
  }
  return { gameVersions, loaders }
}

const RELATION_TYPE = {
  1: 'embedded',
  2: 'optional',
  3: 'required'
} as const

export function toModVersionRef(file: CurseForgeFile): ModVersionRef {
  const { gameVersions, loaders } = splitGameVersionsAndLoaders(file.gameVersions)
  const sha1 = file.hashes.find((h) => h.algo === 1)?.value

  return {
    source: 'curseforge',
    projectId: String(file.modId),
    versionId: String(file.id),
    displayName: file.displayName,
    gameVersions,
    loaders,
    downloadUrl: file.downloadUrl ?? undefined,
    filename: file.fileName,
    fileSize: file.fileLength,
    sha1,
    dependencies: file.dependencies
      .filter((d) => d.relationType in RELATION_TYPE)
      .map((d) => ({
        projectId: String(d.modId),
        source: 'curseforge' as const,
        relation: RELATION_TYPE[d.relationType as keyof typeof RELATION_TYPE]
      })),
    releaseDate: file.fileDate
  }
}
