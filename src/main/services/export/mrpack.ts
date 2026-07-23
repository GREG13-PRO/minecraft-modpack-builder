import { createWriteStream } from 'fs'
import { ZipArchive } from 'archiver'
import type { ExportModWarning, ExportResult, ModpackMod, ModpackProject } from '@shared/types'
import { CONTENT_SUBFOLDER } from './download'

const LOADER_DEPENDENCY_KEY = {
  fabric: 'fabric-loader',
  forge: 'forge',
  neoforge: 'neoforge',
  quilt: 'quilt-loader'
} as const

interface MrpackFile {
  path: string
  hashes: { sha1: string; sha512?: string }
  downloads: string[]
  fileSize: number
  env: { client: 'required' | 'unsupported'; server: 'required' | 'unsupported' }
}

function buildFileEntry(mod: ModpackMod, subfolder: string, warnings: ExportModWarning[]): MrpackFile | undefined {
  const { downloadUrl, sha1, filename, fileSize } = mod.pinnedVersion

  if (!downloadUrl) {
    warnings.push({ mod, format: 'mrpack', reasonCode: 'distribution-disabled' })
    return undefined
  }
  if (!sha1) {
    warnings.push({ mod, format: 'mrpack', reasonCode: 'missing-hash' })
    return undefined
  }

  return {
    path: `${subfolder}/${filename}`,
    hashes: { sha1, sha512: mod.pinnedVersion.sha512 },
    downloads: [encodeURI(downloadUrl)],
    fileSize: fileSize ?? 0,
    env: { client: 'required', server: subfolder === CONTENT_SUBFOLDER.mod ? 'required' : 'unsupported' }
  }
}

export async function exportMrpack(project: ModpackProject, outputPath: string): Promise<ExportResult> {
  const warnings: ExportModWarning[] = []
  const files: MrpackFile[] = []

  const groups = [
    { items: project.mods, subfolder: CONTENT_SUBFOLDER.mod },
    { items: project.resourcePacks, subfolder: CONTENT_SUBFOLDER.resourcepack },
    { items: project.shaders, subfolder: CONTENT_SUBFOLDER.shader }
  ]
  for (const group of groups) {
    for (const mod of group.items) {
      const entry = buildFileEntry(mod, group.subfolder, warnings)
      if (entry) files.push(entry)
    }
  }

  const index = {
    formatVersion: 1,
    game: 'minecraft',
    versionId: `${project.mcVersion.id}-${Date.now()}`,
    name: project.name,
    dependencies: {
      minecraft: project.mcVersion.id,
      [LOADER_DEPENDENCY_KEY[project.loader]]: project.loaderVersion ?? 'latest'
    },
    files
  }

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = new ZipArchive({ zlib: { level: 9 } })
    output.on('close', () => resolve())
    archive.on('error', reject)
    archive.pipe(output)
    archive.append(JSON.stringify(index, null, 2), { name: 'modrinth.index.json' })
    archive.finalize()
  })

  return { format: 'mrpack', outputPath, warnings }
}
