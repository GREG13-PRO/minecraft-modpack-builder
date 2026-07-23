import { shell } from 'electron'
import { promises as fs } from 'fs'
import type { LauncherType } from '@shared/types'

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

// Best-effort common install locations. There is no supported API on either
// launcher to query "where am I installed" — this is a convenience guess,
// not a guarantee. TLauncher has no fixed install location at all (its
// installer lets the user pick one), so it's intentionally left empty:
// the user has to browse for it once via Settings.
function candidatePaths(type: LauncherType): string[] {
  if (type === 'tlauncher') return []

  const paths: string[] = []
  if (process.platform === 'win32') {
    const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files'
    const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
    const localAppData = process.env['LOCALAPPDATA'] ?? ''
    paths.push(
      `${programFilesX86}\\Minecraft Launcher\\MinecraftLauncher.exe`,
      `${programFiles}\\Minecraft Launcher\\MinecraftLauncher.exe`,
      `${localAppData}\\Programs\\Minecraft Launcher\\MinecraftLauncher.exe`
    )
  } else if (process.platform === 'darwin') {
    paths.push('/Applications/Minecraft.app')
  }
  return paths
}

export async function detectLauncherPath(type: LauncherType): Promise<string | undefined> {
  for (const candidate of candidatePaths(type)) {
    if (await exists(candidate)) return candidate
  }
  return undefined
}

export async function launchExecutable(execPath: string): Promise<void> {
  if (!(await exists(execPath))) {
    throw new Error(`Path does not exist: ${execPath}`)
  }
  // shell.openPath delegates to the OS's native "open" mechanism, which
  // handles both a Windows .exe and a macOS .app bundle uniformly. It
  // resolves with an error string on failure rather than throwing.
  const error = await shell.openPath(execPath)
  if (error) throw new Error(error)
}
