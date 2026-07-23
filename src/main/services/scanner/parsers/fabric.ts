export interface ParsedModIdentity {
  modId: string
  name?: string
  version?: string
}

// Parses fabric.mod.json (used by both Fabric and Quilt mods).
export function parseFabricModJson(raw: string): ParsedModIdentity | undefined {
  try {
    const json = JSON.parse(raw) as { id?: string; name?: string; version?: string }
    if (!json.id) return undefined
    return { modId: json.id, name: json.name, version: json.version }
  } catch {
    return undefined
  }
}
