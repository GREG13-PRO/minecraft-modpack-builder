export type ModLoader = 'forge' | 'fabric' | 'neoforge' | 'quilt'

export type ModSource = 'curseforge' | 'modrinth'

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
  page?: number
  pageSize?: number
}

export interface ModSearchResult {
  refs: ModRef[]
  totalCount: number
}

export type ExportFormat = 'mrpack' | 'curseforge-zip'

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
