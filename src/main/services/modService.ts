import type { ModSearchParams, ModSearchResult, ModRef, ModVersionRef } from '@shared/types'
import * as modrinth from './modrinth/client'
import { toModRef, toModVersionRef } from './modrinth/mapper'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry<unknown>>()

function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value as T)
  }
  return fetcher().then((value) => {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  })
}

export async function searchMods(params: ModSearchParams): Promise<ModSearchResult> {
  const { query, mcVersion, loader, page = 0, pageSize = 20 } = params
  const cacheKey = `search:${query}:${mcVersion}:${loader}:${page}:${pageSize}`

  // Only Modrinth is wired up so far; CurseForge integration lands in M2.
  return withCache(cacheKey, async () => {
    const res = await modrinth.searchProjects(query, mcVersion, loader, page, pageSize)
    return {
      refs: res.hits.map(toModRef),
      totalCount: res.total_hits
    }
  })
}

export async function getReleaseGameVersions(): Promise<string[]> {
  return withCache('gameVersions:releases', async () => {
    const tags = await modrinth.getGameVersions()
    return tags.filter((t) => t.version_type === 'release').map((t) => t.version)
  })
}

export async function listVersions(ref: ModRef, mcVersion: string, loader: string): Promise<ModVersionRef[]> {
  const cacheKey = `versions:${ref.source}:${ref.projectId}:${mcVersion}:${loader}`

  return withCache(cacheKey, async () => {
    if (ref.source === 'modrinth') {
      const versions = await modrinth.listVersions(ref.projectId, mcVersion, loader)
      return versions.map(toModVersionRef)
    }
    throw new Error('CurseForge support is not implemented yet')
  })
}
