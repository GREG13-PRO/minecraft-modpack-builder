import type { ContentType, ModLoader, ApiKeyTestResult } from '@shared/types'
import { getCurseForgeApiKey } from '../secureSettings'

const BASE_URL = 'https://api.curseforge.com/v1'
const MINECRAFT_GAME_ID = 432
const REQUEST_TIMEOUT_MS = 8_000

// Verified live against GET /v1/categories?gameId=432 (isClass=true entries).
const CLASS_ID: Record<ContentType, number> = {
  mod: 6,
  resourcepack: 12,
  shader: 6552
}

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
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`CurseForge API error ${response.status}: ${await response.text()}`)
  }

  return (await response.json()) as T
}

async function requestPost<T>(path: string, body: unknown): Promise<T> {
  const apiKey = await getCurseForgeApiKey()
  if (!apiKey) throw new MissingApiKeyError()

  const response = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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
  contentType: ContentType,
  page = 0,
  pageSize = 20
): Promise<CurseForgeSearchResponse> {
  const params: Record<string, string> = {
    gameId: String(MINECRAFT_GAME_ID),
    classId: String(CLASS_ID[contentType]),
    searchFilter: query,
    gameVersion: mcVersion,
    index: String(page * pageSize),
    pageSize: String(pageSize)
  }
  // Resource packs/shaders aren't loader-specific on CurseForge either.
  if (contentType === 'mod') params.modLoaderType = String(MOD_LOADER_TYPE[loader])

  return request<CurseForgeSearchResponse>('/mods/search', params)
}

export function listFiles(
  modId: string,
  mcVersion: string,
  loader: ModLoader,
  contentType: ContentType
): Promise<CurseForgeFilesResponse> {
  const params: Record<string, string> = { gameVersion: mcVersion }
  if (contentType === 'mod') params.modLoaderType = String(MOD_LOADER_TYPE[loader])
  return request<CurseForgeFilesResponse>(`/mods/${modId}/files`, params)
}

export function getMod(modId: string): Promise<{ data: CurseForgeMod }> {
  return request<{ data: CurseForgeMod }>(`/mods/${modId}`)
}

export interface CurseForgeFingerprintMatch {
  id: number
  file: CurseForgeFile
}

export interface CurseForgeFingerprintResponse {
  data: {
    exactMatches: CurseForgeFingerprintMatch[]
    unmatchedFingerprints: number[]
  }
}

// Identifies installed jars by their CurseForge murmur2 fingerprint — the
// same mechanism the official CurseForge app uses to recognize local files.
export function matchFingerprints(fingerprints: number[]): Promise<CurseForgeFingerprintResponse> {
  return requestPost<CurseForgeFingerprintResponse>('/fingerprints', { fingerprints })
}

export function getModsByIds(modIds: number[]): Promise<{ data: CurseForgeMod[] }> {
  if (modIds.length === 0) return Promise.resolve({ data: [] })
  return requestPost<{ data: CurseForgeMod[] }>('/mods', { modIds })
}

// Verifies a key against a minimal, parameter-free endpoint so a bad/wrong-type
// key (e.g. a Studio personal access token instead of a Core API key) is caught
// immediately instead of surfacing later as a confusing empty search result.
export async function testApiKey(key: string): Promise<ApiKeyTestResult> {
  const response = await fetch(`${BASE_URL}/games`, {
    headers: { 'x-api-key': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  if (response.ok) return { ok: true, status: response.status }
  return { ok: false, status: response.status, message: await response.text() }
}
