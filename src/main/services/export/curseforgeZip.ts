import { createWriteStream } from 'fs'
import { ZipArchive } from 'archiver'
import type { ExportModWarning, ExportResult, ModpackMod, ModpackProject } from '@shared/types'
import { CONTENT_SUBFOLDER, fetchModBuffer } from './download'

// CurseForge modLoaderType id strings used in manifest.json's modLoaders[].id
const LOADER_MANIFEST_PREFIX = {
  fabric: 'fabric',
  forge: 'forge',
  neoforge: 'neoforge',
  quilt: 'quilt'
} as const

async function addModpackMod(
  archive: ZipArchive,
  mod: ModpackMod,
  subfolder: string,
  cfFiles: { projectID: number; fileID: number; required: boolean }[],
  warnings: ExportModWarning[]
): Promise<void> {
  if (mod.ref.source === 'curseforge') {
    // The manifest only needs the ids — the importing client resolves and
    // downloads the actual file itself via the CurseForge API.
    cfFiles.push({ projectID: Number(mod.ref.projectId), fileID: Number(mod.pinnedVersion.versionId), required: true })
    return
  }

  // Modrinth-sourced content has no CurseForge project id, so it must be
  // bundled as an actual file under overrides/ instead — this is the
  // standard way cross-platform mods get included in a CurseForge pack.
  try {
    const buffer = await fetchModBuffer(mod)
    archive.append(buffer, { name: `overrides/${subfolder}/${mod.pinnedVersion.filename}` })
  } catch (err) {
    warnings.push({
      mod,
      format: 'curseforge-zip',
      reason: `${mod.ref.name}: ${err instanceof Error ? err.message : String(err)}`
    })
  }
}

export async function exportCurseForgeZip(project: ModpackProject, outputPath: string): Promise<ExportResult> {
  const warnings: ExportModWarning[] = []
  const cfFiles: { projectID: number; fileID: number; required: boolean }[] = []

  const groups = [
    { items: project.mods, subfolder: CONTENT_SUBFOLDER.mod },
    { items: project.resourcePacks, subfolder: CONTENT_SUBFOLDER.resourcepack },
    { items: project.shaders, subfolder: CONTENT_SUBFOLDER.shader }
  ]

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = new ZipArchive({ zlib: { level: 9 } })
    output.on('close', () => resolve())
    archive.on('error', reject)
    archive.pipe(output)

    const work = groups.flatMap((group) =>
      group.items.map((mod) => addModpackMod(archive, mod, group.subfolder, cfFiles, warnings))
    )

    Promise.all(work)
      .then(() => {
        const manifest = {
          minecraft: {
            version: project.mcVersion.id,
            modLoaders: [{ id: `${LOADER_MANIFEST_PREFIX[project.loader]}-${project.loaderVersion ?? 'recommended'}`, primary: true }]
          },
          manifestType: 'minecraftModpack',
          manifestVersion: 1,
          name: project.name,
          version: '1.0.0',
          author: '',
          files: cfFiles,
          overrides: 'overrides'
        }
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
        archive.finalize()
      })
      .catch(reject)
  })

  return { format: 'curseforge-zip', outputPath, warnings }
}
