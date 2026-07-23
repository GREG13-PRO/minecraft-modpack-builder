import type { ParsedModIdentity } from './fabric'

// Parses mcmod.info, used by pre-1.13 Forge mods. Historically a JSON array,
// though some ancient mods shipped a bare object or malformed JSON — treat
// any parse failure as "unrecognized" rather than throwing.
export function parseMcmodInfo(raw: string): ParsedModIdentity | undefined {
  try {
    const json = JSON.parse(raw) as
      | { modid?: string; name?: string; version?: string }[]
      | { modList?: { modid?: string; name?: string; version?: string }[] }
    const entry = Array.isArray(json) ? json[0] : json.modList?.[0]
    if (!entry?.modid) return undefined
    return { modId: entry.modid, name: entry.name, version: entry.version }
  } catch {
    return undefined
  }
}
