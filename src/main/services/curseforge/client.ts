import type { ModLoader, ApiKeyTestResult } from '@shared/types'
import { getCurseForgeApiKey } from '../secureSettings'

const BASE_URL = 'https://api.curseforge.com/v1'
const MINECRAFT_GAME_ID = 432
const MODS_CLASS_ID = 6

// https://docs.curseforge.com/rest-api/#tocS_ModLoaderType
const MOD_LOADER_TYPE: Record<ModLoader, number> = {
  forge: 1,
  fabric: 4,
  quilt: 5,
  neoforge: 6
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('No CurseForge API key configured')
    this.name = 'MissingApiKeyError'
  }
}

async function request<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = await getCurseForgeApiKey()
  if (!apiKey) throw new MissingApiKeyError()

  const url = new URL(BASE_URL + path)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' }
  })

  if (!response.ok) {
    throw new Error(`CurseForge API error ${response.status}: ${await response.text()}`)
  }

  return (await response.json()) as T
}

export interface CurseForgeModLogo {
  thumbnailUrl: string
  url: string
}

export interface CurseForgeMod {
  id: number
  gameId: number
  name: string
  slug: string
  summary: string
  logo: CurseForgeModLogo | null
}

export interface CurseForgeSearchResponse {
  data: CurseForgeMod[]
  pagination: { index: number; pageSize: number; resultCount: number; totalCount: number }
}

export interface CurseForgeHash {
  value: string
  algo: number // 1 = sha1, 2 = md5
}

export interface CurseForgeDependency {
  modId: number
  relationType: number // 1=embedded,2=optional,3=required,4=tool,5=incompatible,6=include
}

export interface CurseForgeFile {
  id: number
  modId: number
  displayName: string
  fileName: string
  fileDate: string
  fileLength: number
  downloadUrl: string | null
  gameVersions: string[]
  hashes: CurseForgeHash[]
  dependencies: CurseForgeDependency[]
}

export interface CurseForgeFilesResponse {
  data: CurseForgeFile[]
}

export function searchMods(
  query: string,
  mcVersion: string,
  loader: ModLoader,
  page = 0,
  pageSize = 20
): Promise<CurseForgeSearchResponse> {
  return request<CurseForgeSearchResponse>('/mods/search', {
    gameId: String(MINECRAFT_GAME_ID),
    classId: String(MODS_CLASS_ID),
    searchFilter: query,
    gameVersion: mcVersion,
    modLoaderType: String(MOD_LOADER_TYPE[loader]),
    index: String(page * pageSize),
    pageSize: String(pageSize)
  })
}

export function listFiles(modId: string, mcVersion: string, loader: ModLoader): Promise<CurseForgeFilesResponse> {
  return request<CurseForgeFilesResponse>(`/mods/${modId}/files`, {
    gameVersion: mcVersion,
    modLoaderType: String(MOD_LOADER_TYPE[loader])
  })
}

export function getMod(modId: string): Promise<{ data: CurseForgeMod }> {
  return request<{ data: CurseForgeMod }>(`/mods/${modId}`)
}

// Verifies a key against a minimal, parameter-free endpoint so a bad/wrong-type
// key (e.g. a Studio personal access token instead of a Core API key) is caught
// immediately instead of surfacing later as a confusing empty search result.
export async function testApiKey(key: string): Promise<ApiKeyTestResult> {
  const response = await fetch(`${BASE_URL}/games`, {
    headers: { 'x-api-key': key, Accept: 'application/json' }
  })
  if (response.ok) return { ok: true, status: response.status }
  return { ok: false, status: response.status, message: await response.text() }
}
