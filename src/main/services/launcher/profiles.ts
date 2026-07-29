import { promises as fs } from 'fs'
import { join } from 'path'

interface LauncherProfileEntry {
  name: string
  type: string
  created: string
  lastUsed: string
  lastVersionId: string
  icon?: string
  gameDir?: string
}

interface LauncherProfilesFile {
  profiles: Record<string, LauncherProfileEntry>
  selectedProfile?: string
  [key: string]: unknown
}

// Merges a single profile entry into the launcher's existing
// launcher_profiles.json, keyed by profileKey so each project gets its own
// stable slot without ever touching the user's other profiles. Never
// creates the file from scratch, and bails out if it doesn't already look
// like a real profiles file — if the launcher hasn't been run yet, or this
// isn't actually launcher-compatible, writing a guessed structure risks
// corrupting something we can't read back to verify.
export async function upsertLauncherProfile(
  minecraftDir: string,
  profileKey: string,
  profileName: string,
  versionId: string,
  gameDir: string | undefined
): Promise<boolean> {
  const filePath = join(minecraftDir, 'launcher_profiles.json')
  let data: LauncherProfilesFile

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as LauncherProfilesFile
    if (typeof parsed.profiles !== 'object' || parsed.profiles === null) return false
    data = parsed
  } catch {
    return false
  }

  const now = new Date().toISOString()
  const existing = data.profiles[profileKey]
  data.profiles[profileKey] = {
    ...existing,
    name: profileName,
    type: 'custom',
    created: existing?.created ?? now,
    lastUsed: now,
    lastVersionId: versionId,
    icon: existing?.icon ?? 'Furnace',
    ...(gameDir ? { gameDir } : {})
  }
  data.selectedProfile = profileKey

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
}
