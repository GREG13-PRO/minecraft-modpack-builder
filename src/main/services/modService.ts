import type { ModSearchParams, ModSearchResult, ModRef, ModVersionRef, ModLoader } from '@shared/types'
import * as modrinth from './modrinth/client'
import { toModRef as toModrinthRef, toModVersionRef as toModrinthVersionRef } from './modrinth/mapper'
import * as curseforge from './curseforge/client'
import { MissingApiKeyError } from './curseforge/client'
import { toModRef as toCurseForgeRef, toModVersionRef as toCurseForgeVersionRef } from './curseforge/mapper'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry<unknown>>()

function withCache<T>(key: string, fetcher: () => Promise<T>, shouldCache: (value: T) => boolean = () => true): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value as T)
  }
  return fetcher().then((value) => {
    if (shouldCache(value)) {
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    }
    return value
  })
}

async function searchModrinth(params: ModSearchParams): Promise<ModSearchResult> {
  const { query, mcVersion, loader, page = 0, pageSize = 20 } = params
  const res = await modrinth.searchProjects(query, mcVersion, loader, page, pageSize)
  return { refs: res.hits.map(toModrinthRef), totalCount: res.total_hits }
}

async function searchCurseForge(params: ModSearchParams): Promise<ModSearchResult> {
  const { query, mcVersion, loader, page = 0, pageSize = 20 } = params
  try {
    const res = await curseforge.searchMods(query, mcVersion, loader, page, pageSize)
    return { refs: res.data.map(toCurseForgeRef), totalCount: res.pagination.totalCount }
  } catch (err) {
    if (err instanceof MissingApiKeyError) return { refs: [], totalCount: 0 }
    const message =
      err instanceof Error && /\b403\b/.test(err.message)
        ? 'Érvénytelen CurseForge API kulcs (403). Ellenőrizd a Beállításokban.'
        : err instanceof Error
          ? err.message
          : String(err)
    return { refs: [], totalCount: 0, sourceErrors: [{ source: 'curseforge', message }] }
  }
}

export async function searchMods(params: ModSearchParams): Promise<ModSearchResult> {
  const { source } = params
  const cacheKey = `search:${source}:${params.query}:${params.mcVersion}:${params.loader}:${params.page ?? 0}:${params.pageSize ?? 20}`

  return withCache(
    cacheKey,
    async () => {
      if (source === 'modrinth') return searchModrinth(params)
      if (source === 'curseforge') return searchCurseForge(params)

      const [modrinthResult, curseforgeResult] = await Promise.all([
        searchModrinth(params),
        searchCurseForge(params)
      ])
      return {
        refs: [...modrinthResult.refs, ...curseforgeResult.refs],
        totalCount: modrinthResult.totalCount + curseforgeResult.totalCount,
        sourceErrors: [...(modrinthResult.sourceErrors ?? []), ...(curseforgeResult.sourceErrors ?? [])]
      }
    },
    (result) => !result.sourceErrors || result.sourceErrors.length === 0
  )
}

export async function getReleaseGameVersions(): Promise<string[]> {
  return withCache('gameVersions:releases', async () => {
    const tags = await modrinth.getGameVersions()
    return tags.filter((t) => t.version_type === 'release').map((t) => t.version)
  })
}

export async function listVersions(ref: ModRef, mcVersion: string, loader: ModLoader): Promise<ModVersionRef[]> {
  const cacheKey = `versions:${ref.source}:${ref.projectId}:${mcVersion}:${loader}`

  return withCache(cacheKey, async () => {
    if (ref.source === 'modrinth') {
      const versions = await modrinth.listVersions(ref.projectId, mcVersion, loader)
      return versions.map(toModrinthVersionRef)
    }

    const res = await curseforge.listFiles(ref.projectId, mcVersion, loader)
    return res.data.map(toCurseForgeVersionRef)
  })
}
