import TOML from '@iarna/toml'
import type { ParsedModIdentity } from './fabric'

// Parses META-INF/mods.toml (Forge/NeoForge, 1.13+). The version field is
// frequently a Gradle-expanded placeholder like "${file.jarVersion}" that
// only resolves at build time — callers should fall back to reading
// MANIFEST.MF's Implementation-Version when they see that literal string.
export function parseModsToml(raw: string): ParsedModIdentity | undefined {
  try {
    const parsed = TOML.parse(raw) as { mods?: { modId?: string; displayName?: string; version?: string }[] }
    const mod = parsed.mods?.[0]
    if (!mod?.modId) return undefined
    return { modId: mod.modId, name: mod.displayName, version: mod.version }
  } catch {
    return undefined
  }
}

export function isUnresolvedVersionPlaceholder(version: string | undefined): boolean {
  return !version || version.includes('${')
}

// Pulls Implementation-Version out of a raw META-INF/MANIFEST.MF, used as a
// fallback when mods.toml's version field is an unresolved placeholder.
export function parseManifestImplementationVersion(raw: string): string | undefined {
  const match = raw.match(/Implementation-Version:\s*(.+)/i)
  return match?.[1]?.trim()
}
