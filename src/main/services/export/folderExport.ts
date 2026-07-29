import { join } from 'path'
import { promises as fs } from 'fs'
import type { ExportModWarning, ExportResult, ModpackMod, ModpackProject } from '@shared/types'
import { CONTENT_SUBFOLDER, canDownload, downloadModFile } from './download'

// Wipes stale content from a previous export so removed mods don't linger
// on disk — re-exporting must reflect the project's current state exactly,
// not just add on top of whatever was there before.
async function clearDirectory(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
}

// Downloads every selected mod/resource pack/shader straight into the
// mods/resourcepacks/shaderpacks subfolders of a chosen directory — meant to
// be pointed at directly by launchers with no modpack-format support, like
// TLauncher or the official Minecraft launcher.
export async function exportToFolder(
  project: ModpackProject,
  outputDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<ExportResult> {
  const warnings: ExportModWarning[] = []
  const groups: { items: ModpackMod[]; subfolder: string }[] = [
    { items: project.mods, subfolder: CONTENT_SUBFOLDER.mod },
    { items: project.resourcePacks, subfolder: CONTENT_SUBFOLDER.resourcepack },
    { items: project.shaders, subfolder: CONTENT_SUBFOLDER.shader }
  ]

  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  let done = 0

  for (const group of groups) {
    const destDir = join(outputDir, group.subfolder)
    await clearDirectory(destDir)
    if (group.items.length === 0) continue

    for (const mod of group.items) {
      if (!canDownload(mod)) {
        warnings.push({ mod, format: 'folder', reasonCode: 'distribution-disabled' })
        done++
        onProgress?.(done, total)
        continue
      }

      try {
        await downloadModFile(mod, destDir)
      } catch (err) {
        warnings.push({
          mod,
          format: 'folder',
          reasonCode: 'download-failed',
          detail: err instanceof Error ? err.message : String(err)
        })
      }
      done++
      onProgress?.(done, total)
    }
  }

  return { format: 'folder', outputPath: outputDir, warnings }
}
