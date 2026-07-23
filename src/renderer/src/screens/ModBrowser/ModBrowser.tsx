import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ModRef, ModSource } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ModBrowser.css'

type SourceFilter = ModSource | 'both'

function ModBrowser(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const addMod = useProjectStore((s) => s.addMod)
  const removeMod = useProjectStore((s) => s.removeMod)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('both')

  const { data: hasCurseForgeKey } = useQuery({
    queryKey: ['hasCurseForgeApiKey'],
    queryFn: () => window.api.settings.hasCurseForgeApiKey()
  })

  const { data, isFetching, error } = useQuery({
    queryKey: ['modSearch', query, project?.mcVersion.id, project?.loader, source],
    queryFn: () =>
      window.api.search.searchMods({
        query,
        mcVersion: project!.mcVersion.id,
        loader: project!.loader,
        source
      }),
    enabled: Boolean(project)
  })

  if (!project) return <p>Előbb hozz létre egy projektet.</p>

  const addedIds = new Set(project.mods.map((m) => `${m.ref.source}:${m.ref.projectId}`))

  async function handleAdd(ref: ModRef): Promise<void> {
    const versions = await window.api.search.listVersions(ref, project!.mcVersion.id, project!.loader)
    if (versions.length === 0) return
    addMod({ ref, pinnedVersion: versions[0], addedAt: new Date().toISOString() })
  }

  return (
    <div className="mod-browser">
      <header>
        <h2>
          {project.name} — {project.mcVersion.id} ({project.loader})
        </h2>
        <input placeholder="Mod keresése..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="source-toggle">
          {(['both', 'modrinth', 'curseforge'] as SourceFilter[]).map((s) => (
            <button key={s} className={source === s ? 'active' : ''} onClick={() => setSource(s)}>
              {s === 'both' ? 'Mindkettő' : s === 'modrinth' ? 'Modrinth' : 'CurseForge'}
            </button>
          ))}
        </div>
        {source !== 'modrinth' && hasCurseForgeKey === false && (
          <p className="warning">
            Nincs beállítva CurseForge API kulcs a Beállítások képernyőn — CurseForge találatok nem fognak
            megjelenni.
          </p>
        )}
      </header>

      {isFetching && <p>Keresés...</p>}
      {error && <p className="error">Hiba a keresés során: {(error as Error).message}</p>}

      <ul className="results">
        {data?.refs.map((ref) => {
          const key = `${ref.source}:${ref.projectId}`
          const added = addedIds.has(key)
          return (
            <li key={key}>
              {ref.iconUrl && <img src={ref.iconUrl} alt="" />}
              <div className="info">
                <strong>
                  {ref.name} <span className={`badge ${ref.source}`}>{ref.source}</span>
                </strong>
                <span>{ref.summary}</span>
              </div>
              <button disabled={added} onClick={() => handleAdd(ref)}>
                {added ? 'Hozzáadva' : 'Hozzáadás'}
              </button>
            </li>
          )
        })}
      </ul>

      <section className="selected-mods">
        <h3>Kiválasztott modok ({project.mods.length})</h3>
        <ul>
          {project.mods.map((m) => (
            <li key={`${m.ref.source}:${m.ref.projectId}`}>
              {m.ref.name} — {m.pinnedVersion.displayName}
              <button onClick={() => removeMod(m.ref.projectId, m.ref.source)}>Eltávolítás</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default ModBrowser
