const BASE_URL = 'https://api.modrinth.com/v2'
const USER_AGENT = 'GREG13-PRO/minecraft-modpack-builder/1.0.0 (github.com/GREG13-PRO/minecraft-modpack-builder)'

async function request<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  })

  if (!response.ok) {
    throw new Error(`Modrinth API error ${response.status}: ${await response.text()}`)
  }

  return (await response.json()) as T
}

export interface ModrinthSearchHit {
  project_id: string
  slug: string
  title: string
  description: string
  icon_url: string | null
}

export interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[]
  total_hits: number
}

export interface ModrinthDependency {
  project_id: string | null
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
}

export interface ModrinthVersion {
  id: string
  project_id: string
  name: string
  version_number: string
  game_versions: string[]
  loaders: string[]
  date_published: string
  dependencies: ModrinthDependency[]
  files: {
    url: string
    filename: string
    size: number
    primary: boolean
    hashes: { sha1: string; sha512: string }
  }[]
}

export function searchProjects(
  query: string,
  mcVersion: string,
  loader: string,
  page = 0,
  pageSize = 20
): Promise<ModrinthSearchResponse> {
  const facets = JSON.stringify([[`versions:${mcVersion}`], [`categories:${loader}`], ['project_type:mod']])
  return request<ModrinthSearchResponse>('/search', {
    query,
    facets,
    offset: String(page * pageSize),
    limit: String(pageSize)
  })
}

export function listVersions(projectId: string, mcVersion: string, loader: string): Promise<ModrinthVersion[]> {
  return request<ModrinthVersion[]>(`/project/${projectId}/version`, {
    game_versions: JSON.stringify([mcVersion]),
    loaders: JSON.stringify([loader])
  })
}

export interface ModrinthGameVersionTag {
  version: string
  version_type: 'release' | 'snapshot' | 'alpha' | 'beta'
}

export function getGameVersions(): Promise<ModrinthGameVersionTag[]> {
  return request<ModrinthGameVersionTag[]>('/tag/game_version')
}

export function getVersionsByHashes(hashes: string[], algorithm: 'sha1' | 'sha512'): Promise<Record<string, ModrinthVersion>> {
  const url = new URL(BASE_URL + '/version_files')
  return fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashes, algorithm })
  }).then((res) => {
    if (!res.ok) throw new Error(`Modrinth API error ${res.status}`)
    return res.json()
  })
}

export interface ModrinthProject {
  id: string
  slug: string
  title: string
  description: string
  icon_url: string | null
}

export function getProjectsByIds(ids: string[]): Promise<ModrinthProject[]> {
  if (ids.length === 0) return Promise.resolve([])
  return request<ModrinthProject[]>('/projects', { ids: JSON.stringify(ids) })
}
