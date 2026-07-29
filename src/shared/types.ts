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
  lastExportPaths?: Partial<Record<ExportFormat, string>>
}

// Identifies a mod project for a lookup call without needing a full ModRef
// yet — used to resolve dependency projectIds returned by a version's
// `dependencies` list back into displayable ModRefs.
export interface DependencyLookup {
  source: ModSource
  projectId: string
}

// 'not-published' is distinct from 'unrecognized': the jar's own metadata
// was read fine (name/version known), it just isn't on Modrinth or
// CurseForge to check against — common for launcher-bundled utility mods
// (e.g. TLauncher's own cape-rendering mod). Not a problem to flag, unlike
// a truly unreadable jar.
export type ScanStatus =
  | 'up-to-date'
  | 'outdated'
  | 'incompatible-loader'
  | 'unrecognized'
  | 'not-published'
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

// Reason codes rather than pre-rendered strings so the renderer can localize
// them — these originate in the main process, which has no notion of the
// UI's current language.
export type ModSourceErrorCode = 'invalid-api-key' | 'other'

export interface ModSourceError {
  source: ModSource
  code: ModSourceErrorCode
  detail?: string
  status?: number
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

export type ExportWarningReason = 'distribution-disabled' | 'missing-hash' | 'download-failed'

export interface ExportModWarning {
  mod: ModpackMod
  format: ExportFormat
  reasonCode: ExportWarningReason
  detail?: string
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

// Which launcher the "Launch" button should open. Neither launcher exposes a
// CLI/API to auto-launch a specific profile, so we can't press Play for the
// user — but both read the same launcher_profiles.json, so we can at least
// write/select the right profile (version + loader + game dir) there before
// opening the app, leaving only the Play click manual.
export type LauncherType = 'official' | 'tlauncher'

export interface LauncherSettings {
  type: LauncherType
  path?: string
}

export interface LauncherStatus {
  type: LauncherType
  path?: string
  detectedPath?: string
}

// Whether we could point the launcher's profile at the right installed
// version before opening it. We never install a mod loader ourselves, so
// 'version-not-installed' just means the user hasn't run that loader's own
// installer for this Minecraft version yet — not a bug.
export type LaunchProfileOutcome =
  'configured' | 'version-not-installed' | 'profiles-file-unavailable'

export interface LaunchResult {
  profileOutcome: LaunchProfileOutcome
  versionId?: string
}

export type UpdaterStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }
