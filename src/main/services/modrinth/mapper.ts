import type { ModLoader, ModRef, ModVersionRef } from '@shared/types'
import type { ModrinthSearchHit, ModrinthVersion } from './client'

const KNOWN_LOADERS: ModLoader[] = ['forge', 'fabric', 'neoforge', 'quilt']

export function toModRef(hit: ModrinthSearchHit): ModRef {
  return {
    source: 'modrinth',
    projectId: hit.project_id,
    slug: hit.slug,
    name: hit.title,
    iconUrl: hit.icon_url ?? undefined,
    summary: hit.description
  }
}

export function toModVersionRef(version: ModrinthVersion): ModVersionRef {
  const primaryFile = version.files.find((f) => f.primary) ?? version.files[0]
  return {
    source: 'modrinth',
    projectId: version.project_id,
    versionId: version.id,
    displayName: version.name || version.version_number,
    gameVersions: version.game_versions,
    loaders: version.loaders.filter((l): l is ModLoader => KNOWN_LOADERS.includes(l as ModLoader)),
    downloadUrl: primaryFile?.url,
    filename: primaryFile?.filename ?? '',
    fileSize: primaryFile?.size,
    sha1: primaryFile?.hashes.sha1,
    sha512: primaryFile?.hashes.sha512,
    dependencies: version.dependencies
      .filter((d) => d.project_id && d.dependency_type !== 'incompatible')
      .map((d) => ({
        projectId: d.project_id as string,
        source: 'modrinth' as const,
        relation: d.dependency_type === 'embedded' ? 'embedded' : d.dependency_type === 'optional' ? 'optional' : 'required'
      })),
    releaseDate: version.date_published
  }
}
