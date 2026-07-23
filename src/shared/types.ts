export type ModLoader = 'forge' | 'fabric' | 'neoforge' | 'quilt'

export type ModSource = 'curseforge' | 'modrinth'

// What kind of content is being searched/stored. Resource packs and shaders
// aren't tied to a mod loader the way mods are (shaders use their own
// "loaders" like iris/optifine on Modrinth) — the ModLoader filter only
// applies when contentType is 'mod'.
export type ContentType = 'mod' | 'resourcepack' | 'shader'

export interface MinecraftVersion {
  id: string
  type: 'release' | 'snapshot'
}

export interface ModRef {
  source: ModSource
  projectId: string
  slug: string
  name: string
  iconUrl?: string
  summary?: string
}

export interface ModDependencyRef {
  projectId: string
  source: ModSource
  relation: 'required' | 'optional' | 'embedded'
}

export interface ModVersionRef {
  source: ModSource
  projectId: string
  versionId: string
  displayName: string
  gameVersions: string[]
  loaders: ModLoader[]
  downloadUrl?: string
  filename: string
  fileSize?: number
  sha1?: string
  sha512?: string
  dependencies: ModDependencyRef[]
  releaseDate: string
}

export interface ModpackMod {
  ref: ModRef
  pinnedVersion: ModVersionRef
  addedAt: string
  fromLocalScan?: boolean
}

export interface ModpackProject {
  id: string
  name: string
  mcVersion: MinecraftVersion
  loader: ModLoader
  loaderVersion?: string
  mods: ModpackMod[]
  resourcePacks: ModpackMod[]
  shaders: ModpackMod[]
  createdAt: string
  updatedAt: string
}

export type ScanStatus =
  | 'up-to-date'
  | 'outdated'
  | 'incompatible-loader'
  | 'unrecognized'
  | 'not-on-target-mc-version'

export interface InstalledModScanResult {
  filePath: string
  detectedIdentity?: {
    modId: string
    name?: string
    version?: string
    source: ModSource | 'unknown'
  }
  matchedRef?: ModRef
  matchedVersion?: ModVersionRef
  latestCompatibleVersion?: ModVersionRef
  status: ScanStatus
}

export interface ModSearchParams {
  query: string
  mcVersion: string
  loader: ModLoader
  source: ModSource | 'both'
  contentType: ContentType
  page?: number
  pageSize?: number
}

export interface ModSourceError {
  source: ModSource
  message: string
}

export interface ModSearchResult {
  refs: ModRef[]
  totalCount: number
  sourceErrors?: ModSourceError[]
}

// 'folder' downloads everything straight into mods/resourcepacks/shaderpacks
// subfolders — for launchers with no modpack-format support (TLauncher, the
// official launcher). 'mrpack'/'curseforge-zip' are the standard pack formats.
export type ExportFormat = 'folder' | 'mrpack' | 'curseforge-zip'

export interface ExportModWarning {
  mod: ModpackMod
  format: ExportFormat
  reason: string
}

export interface ExportResult {
  format: ExportFormat
  outputPath: string
  warnings: ExportModWarning[]
}

export interface ApiKeyTestResult {
  ok: boolean
  status: number
  message?: string
}
